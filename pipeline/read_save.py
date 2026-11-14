"""Lector del array `Items` de un guardado GVAS de Osta (UE5). Sólo lectura.

Formato reproducido del lector anterior (read_snapshot.py): cada propiedad lleva
nombre, árbol de tipos, tamaño, flags y carga útil. Se extraen ID, AttachedParts,
BeyondRepair, Transform y el resto de campos simples.
"""
import struct


class SaveFormatError(Exception):
    pass


def parse_items(b: bytes):
    def i32(p):
        return struct.unpack_from('<i', b, p)[0]

    def string(p):
        n = i32(p)
        if not 0 < n < 10000:
            raise SaveFormatError(f'cadena inválida en {p} (longitud {n})')
        return b[p + 4:p + 4 + n - 1].decode('utf-8'), p + 4 + n

    def typ(p):
        name, p = string(p)
        num = i32(p)
        p += 4
        children = []
        for _ in range(num):
            v, p = typ(p)
            children.append(v)
        return (name, children), p

    def prop(p):
        name, p = string(p)
        if name == 'None':
            return name, None, None, None, p
        t, p = typ(p)
        size = i32(p)
        flags = b[p + 4]
        p += 5
        if flags not in (0, 8, 16, 32, 48):
            raise SaveFormatError(f'flags desconocidos {flags} en {name}')
        return name, t, flags, b[p:p + size], p + size

    try:
        start = b.index(b'\x06\0\0\0Items\0')
    except ValueError:
        raise SaveFormatError('no se encontró la propiedad Items')
    _, _, _, payload, end = prop(start)
    count = struct.unpack_from('<i', payload)[0]
    p = end - len(payload) + 4
    records = []
    for index in range(count):
        r = {'index': index + 1}
        while True:
            name, t, flags, v, p = prop(p)
            if name == 'None':
                break
            key = name.split('_')[0]
            if t[0] == 'IntProperty':
                value = struct.unpack('<i', v)[0]
            elif t[0] == 'Int64Property':
                value = struct.unpack('<q', v)[0]
            elif t[0] == 'BoolProperty':
                value = bool(flags & 16)
            elif t[0] == 'ArrayProperty' and t[1][0][0] == 'IntProperty':
                n = struct.unpack_from('<i', v)[0]
                if len(v) != 4 + 4 * n:
                    raise SaveFormatError('array de enteros inconsistente')
                value = list(struct.unpack_from('<' + 'i' * n, v, 4))
            elif t[0] == 'MapProperty':
                value = {'serialized_bytes': len(v)}
            elif key == 'Transform':
                value = {}
                tp = p - len(v)
                while tp < p:
                    tn, tt, tf, tv, tp = prop(tp)
                    if tn == 'None':
                        break
                    if len(tv) in (24, 32):
                        value[tn] = list(struct.unpack('<' + 'd' * (len(tv) // 8), tv))
            else:
                value = {'serialized_bytes': len(v)}
            r[key] = value
        records.append(r)
    if p != end:
        raise SaveFormatError('el array Items no terminó donde se esperaba')
    return records
