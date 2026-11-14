"""Reglas de clasificación (país, familia, tipo, sección, época, rol de exposición).

Portadas sin cambios de criterio desde collection-classification-20261101/classify.py.
La tabla de «familias que comparten una pieza» (part-parents.json) se congeló tal y
como la calculaba el proceso anterior; para piezas nuevas se completa con las
plantillas nativas actuales.
"""
import json
import re
from config import DATA

country = {}
family = {}


def assign(names, c, f=None):
    for n in names.split('|'):
        country[n] = c
        family[n] = f or n


assign('Brown Bess|P53 Enfield|SMLE Mk III|Sten MKII|Lanchester MkI', 'Reino Unido / Commonwealth')
assign('M700|M1911A1|M1A1 Thompson|BAR|M1 Carbine|M1 Garand|M1D Garand|M3|M3A1|M24 SWS|M82A1M|M16A2|M16A4|M4 Carbine', 'Estados Unidos')
assign('Walther PP|P38|P08|LP 08|MP38|MP40|MP41|MP41R|Karabiner 98 kurz|Gewehr 98|Gewehr 98M|StG44|MG42|MG3|G3A3|Mauser Standardmodell|HK416', 'Alemania')
assign('TT|PM|APB|M1895|Fedorov|PPSh-41|Leningrad PPD40|PPS-43|DP-27|DPM|SVT-38|SVT-40|M1891|M91/30|M38|M44|PE Sniper|PEM Sniper|SKS|SVD|RPK|RPK-74|RPKS-74|AKM|AKMS|AK-74|AKS-74|AKS-74N|PKM|RPG-7V|RPG-7D', 'Rusia / URSS')
assign('Berdan No.2|Berdan No.2 Cavalry', 'Rusia imperial', 'Berdan II')
assign('M1910', 'Bélgica', 'Browning FN 1910')
assign('AMD-65', 'Hungría', 'AK / AMD-65')
assign('PM md. 65|PSL', 'Rumanía')
assign('VZ-58', 'Checoslovaquia')
assign('M76|Zastava M84|M70B1|M70AB2|M92', 'Yugoslavia / Serbia')
assign('Milled Type-56|Milled Type-56-1|Type-56-2|Type 69', 'China')
assign('AT-4', 'Suecia / sistema AT4')
assign('Jezail', 'Tradición afgana / regional', 'Jezail')
assign('Sako Hunting Mosin', 'Finlandia / adaptación civil', 'Mosin de caza')
assign('Frolovka|Shotgun Conversion Berdan No.2|TOZ-34|TOZ-123|IZh-43|MP-133|MP-153|VPO-101M', 'Rusia / URSS · uso civil')
assign('M1935', 'Por confirmar', 'Mosin · M1935 del juego')
assign('Stirnpanzer', 'Alemania', 'Blindaje para casco M16/M17')
assign('Bundled M24 Grenade', 'Alemania', 'Stielhandgranate 24 · agrupación de granadas')
assign('RGN|RG-42|Koveshnikov Fuze F1|TM-62|PNV-57E|Obr.88 Khaki Cap|4-cell AK74 Magazine Pouch|7.62x54mmR Target Ammo Box|5.45x39 Clip', 'Rusia / URSS')
assign('.303 Clip', 'Reino Unido / Commonwealth', 'Accesorios de munición .303')
assign('7.92x57mm Clip', 'Calibre de uso compartido', 'Accesorios de munición 7,92 × 57 mm')
for n in ['M1891', 'M91/30', 'M38', 'M44', 'PE Sniper', 'PEM Sniper']:
    family[n] = 'Mosin-Nagant'
for n in ['AKM', 'AKMS', 'AK-74', 'AKS-74', 'AKS-74N', 'RPK', 'RPK-74', 'RPKS-74', 'AMD-65', 'PM md. 65', 'M70B1', 'M70AB2', 'M92', 'Milled Type-56', 'Milled Type-56-1', 'Type-56-2']:
    family[n] = 'AK / RPK y derivados'
for n in ['MP38', 'MP40', 'MP41']:
    family[n] = 'MP38 / MP40 / MP41'
for n in ['M16A2', 'M16A4', 'M4 Carbine', 'HK416']:
    family[n] = 'AR-15 / M16 / M4 y derivados'
PISTOLS = {'Walther PP', 'P38', 'P08', 'LP 08', 'M1910', 'M1911A1', 'TT', 'PM', 'APB'}
SMG = {'M1A1 Thompson', 'Sten MKII', 'Lanchester MkI', 'MP38', 'MP40', 'MP41', 'MP41R', 'PPSh-41', 'Leningrad PPD40', 'PPS-43', 'M3', 'M3A1'}
MG = {'BAR', 'MG42', 'MG3', 'DP-27', 'DPM', 'RPK', 'RPK-74', 'RPKS-74', 'PKM', 'Zastava M84'}
SHOTGUN = {'Frolovka', 'Shotgun Conversion Berdan No.2', 'TOZ-34', 'TOZ-123', 'IZh-43', 'MP-133', 'MP-153'}
SNIPER = {'PE Sniper', 'PEM Sniper', 'M1D Garand', 'M24 SWS', 'M82A1M', 'SVD', 'PSL', 'M76'}
LAUNCHERS = {'AT-4', 'Panzerfaust 30', 'Panzerfaust 30 Klein', 'RPG-7V', 'RPG-7D', 'Type 69'}
assign('Panzerfaust 30|Panzerfaust 30 Klein', 'Alemania', 'Panzerfaust')


def region(name, path=''):
    if name in country:
        return country[name]
    s = (name + ' ' + path).lower()
    if any(w in s for w in ['m59', 'm70', 'm76', 'm84', 'zastava', 'bosnian', 'jna', 'serbian', 'pma-', 'prom-', 'tma-', 'm75']): return 'Yugoslavia / Balcanes'
    if any(w in s for w in ['french', 'france', 'chauchat']): return 'Francia'
    if 'russian imperial' in s: return 'Rusia imperial'
    if 'estonian' in s: return 'Estonia'
    if 'adrian' in s: return 'Por confirmar'
    if any(w in s for w in ['soviet', 'russian', 'ssh', 'mosin', 'berdan', 'fedorov', 'svd', 'svt', 'psh', 'pmg', 'gp-5', 'm1895', 'ppsh', 'ppd', 'frolov', 'toz', 'izh', 'vpo', 'ks-23', 'shvak', 'rpg', 'rgd', 'katyusha', 'pomos', 'pomz', 'vog-', 'dshk', 'pilotka', 'rdg-', 'rop-', 'sks', 'pkm', 'pk barrel', 'pk bolt', 'pk stock', 'pk ammo', 'pk dust']): return 'Rusia / URSS'
    if any(w in s for w in ['german', 'wehr', 'kar98', 'mg42', 'mg-42', 'stg44', 'luft', 'heer', 'polizei', 'kriegsmarine', 'pickelhaube', 'erel', 'vulkanfiber', 'm16painted', 'm16.m16', 'm18', 'iron cross', 'war merit', 'eihand', 'eierhand', 'kugel', 'zeitzunder', 'betonmine', 's-mine', 'panzerfaust', 'mk108', 'sd15', 'sd70', 'puw', 'mp40', 'mp41', 'g3', 's98', 'ersatz']): return 'Alemania'
    if any(w in s for w in ['smle', 'sten', 'lanchester', 'brodie', 'no.68', 'no.69', 'brown bess', 'pattern1853']): return 'Reino Unido / Commonwealth'
    if re.search(r'\bbar\b', s) or any(w in s for w in ['m1 carbine', 'm1 garand', 'm1d', 'm1911', 'm1a1', 'thompson', 'ar15', 'ar-15', 'stanag', 'm16a', 'm4 ', 'm24 ', 'm82', 'm9 ', 'm1 helmet', 'pasgt', 'm67', 'm1942 canteen', 'm1910 canteen', 'm9a1', 'm6a1', 'mk2 grenade', 'mk3a']): return 'Estados Unidos'
    if any(w in s for w in ['type-56', 'type 69', 'chinese']): return 'China'
    if any(w in s for w in ['vz-58', 'vz58']): return 'Checoslovaquia'
    if 'amd65' in s or 'amd-65' in s: return 'Hungría'
    if any(w in s for w in ['ak ', 'akm', 'aks', 'rpk', '6h4', '6h5']): return 'URSS / variantes compartidas'
    if 'hookah' in s: return 'Tradición regional · sin atribuir'
    return 'Sin atribuir'


_frozen_parents = {k: set(v) for k, v in json.loads((DATA / 'part-parents.json').read_text(encoding='utf-8')).items()}
parents = dict(_frozen_parents)


def extend_parents(classes, templates):
    """Añade familias para piezas que la tabla congelada no conocía."""
    extra = {}
    for cid, t in templates.items():
        if cid not in classes:
            continue
        for n in t['natural']:
            if n['path'] not in _frozen_parents:
                extra.setdefault(n['path'], set()).add(classes[cid]['name'])
    parents.update(extra)


def era(r):
    y = r.get('year')
    if not y: return 'Sin fecha precisa'
    if y < 1800: return 'Siglo XVIII o anterior'
    if y < 1914: return 'Siglo XIX / anterior a 1914'
    if y < 1919: return 'Primera Guerra Mundial / 1914-1918'
    if y < 1939: return 'Entreguerras / 1919-1938'
    if y < 1946: return 'Segunda Guerra Mundial / 1939-1945'
    if y < 1992: return 'Guerra Fría / 1946-1991'
    return 'Época contemporánea / desde 1992'


def section(h, c, r, typ):
    name = r['name']
    y = r.get('year') or 0
    if typ in ['Herramienta', 'Consumible de taller']: return 'Taller y mantenimiento'
    if typ == 'Libro': return 'Biblioteca de referencia'
    if typ in ['Mueble', 'Contenedor']: return 'Mobiliario y almacenamiento'
    if c in ('Sin atribuir', 'Por confirmar'): return 'Identificación pendiente'
    if h == 'Afganistán':
        if name == 'Jezail' or 'Hookah' in name: return 'Tradición local y objetos regionales'
        return 'Fuerzas occidentales modernas' if c in ('Estados Unidos', 'Alemania', 'Suecia / sistema AT4') else 'Guerra Fría y armamento oriental'
    if h == 'Francia':
        if c == 'Alemania': return 'Alemania de posguerra' if y >= 1946 else 'Alemania · 1914-1945 y antecedentes'
        if c == 'Estados Unidos': return 'Estados Unidos de posguerra' if y >= 1946 else 'Aliados · Estados Unidos'
        if c == 'Reino Unido / Commonwealth': return 'Reino Unido y Commonwealth'
        if c in ('Francia', 'Bélgica'): return 'Francia y Bélgica'
        return 'Otras colecciones occidentales'
    if 'uso civil' in c or name in SHOTGUN or name == 'Sako Hunting Mosin': return 'Caza y transformaciones civiles'
    if c == 'Rusia imperial' or name in ('M1891', 'M1895', 'Berdan No.2', 'Berdan No.2 Cavalry', 'Russian Imperial Adrian'): return 'Rusia imperial'
    if c == 'Alemania': return 'Frente oriental · comparación alemana'
    if c == 'Estados Unidos': return 'Material aliado · comparación'
    if c in ('Yugoslavia / Serbia', 'Yugoslavia / Balcanes', 'China', 'Checoslovaquia', 'Hungría', 'Rumanía'): return 'Bloque oriental y Balcanes'
    if c == 'Estonia': return 'Estonia y el Báltico'
    return 'URSS y Rusia'


def classify(r):
    path = r['class']
    cat = path.split('/Items/')[-1].split('/')[0]
    n = r['name']
    low = n.lower()
    h = r['house']
    c = region(n, path)
    fam = family.get(n, n)
    typ = 'Objeto de colección'
    role = 'Exponer' if r.get('ready') else 'Revisar montaje'
    basis = 'Modelo identificado en el juego'
    if cat == 'Parts' or (r['group'] == 'Fuera de exposición' and any(w in low for w in ['filter', 'liner'])):
        par = sorted(parents.get(path, set()))
        fams = sorted({family.get(x, x) for x in par})
        fam = ' / '.join(fams[:5]) if fams else n
        typ = 'Bayoneta / arma blanca' if 'bayonet' in low else 'Interior de casco' if 'liner' in low else 'Óptica' if any(w in low for w in ['scope', 'acog']) else 'Repuesto'
        role = 'Exponer junto a su familia' if typ in ('Bayoneta / arma blanca', 'Óptica') else 'Guardar como repuesto'
        if par:
            countries = {country.get(x, region(x)) for x in par}
            c = next(iter(countries)) if len(countries) == 1 else 'Compatibilidad compartida'
            basis = 'Compatibilidad del juego: ' + ', '.join(par)
        # Los repuestos occidentales viajan con la colección; los compartidos se quedan en origen.
        if r['origin'] == 'Estonia' and c in ('Alemania', 'Estados Unidos', 'Reino Unido / Commonwealth', 'Francia', 'Bélgica'):
            h = 'Francia'
        else:
            h = r['origin']
    elif cat == 'Receivers' and 'Hookah' not in n:
        typ = 'Pistola' if n in PISTOLS else 'Revólver' if n == 'M1895' else 'Subfusil' if n in SMG else 'Ametralladora / fusil automático' if n in MG else 'Escopeta' if n in SHOTGUN else 'Fusil con óptica' if n in SNIPER else 'Lanzador' if n in LAUNCHERS else 'Fusil / carabina'
    elif 'Hookah' in n:
        typ = 'Objeto decorativo'; fam = 'Pipas de agua'; role = 'Exponer · rincón regional'
    elif cat == 'Helmets':
        typ = 'Blindaje frontal de casco' if n == 'Stirnpanzer' else 'Máscara / protección respiratoria' if 'Mask' in n else 'Casco'
    elif cat == 'UXO' or '105mm HE Howitzer Shell' in n:
        typ = 'Vaina' if 'Casing' in n else 'Caja / complemento de munición' if any(w in low for w in ['box', 'can ', 'clip', 'canister']) else 'Mina' if any(w in low for w in ['mine', 'pma-', 'prom-', 'tma-', 'tm-62', 'pomz']) else 'Granada' if any(w in low for w in ['grenade', 'f1', 'rgd', 'rgn', 'rg-', 'rdg', 'm75', 'vog']) else 'Proyectil / munición'
        if n in ('German 77mm Casing', 'German 88mm Casing', 'French 75mm Casing') and r.get('parts'):
            typ = 'Cartucho de artillería · conjunto montado'; fam = n.replace(' Casing', '') + ' · ' + r['parts']
        if n in ('MKIII Bomb', 'MK1 Grenade', 'M43 Grenade'):
            c = 'Por confirmar'; basis = 'Nombre insuficiente para atribución exacta'
    elif cat == 'Books':
        typ = 'Libro'; role = 'Biblioteca'; c = 'Sin atribuir'; fam = path.split('/')[-1].split('.')[0].replace('Book', '') or 'General'
    elif cat == 'Furniture':
        typ = 'Mueble'; role = 'Colocar según espacio'; c = 'Sin atribuir'; fam = 'Exposición / decoración'
    elif cat == 'Crates':
        typ = 'Contenedor'; role = 'Almacenamiento'; fam = 'Cajas y vitrinas'; c = 'Sin atribuir'
    elif cat == 'Tools':
        if n in ('MPL-50', 'WW2 German Shovel'):
            typ = 'Equipo de campaña'; role = 'Exponer junto a su familia'
        else:
            typ = 'Consumible de taller' if any(w in low for w in ['oil', 'aging', 'restore']) else 'Herramienta'; role = 'Taller'; c = 'Sin atribuir'; fam = 'Mantenimiento'
    elif cat == 'Junk':
        typ = 'Utilería / objeto cotidiano'; role = 'Decoración o almacén'; c = 'Sin atribuir'; fam = 'Objetos cotidianos'
    elif cat == 'Misc':
        if any(w in low for w in ['cross', 'medal']): typ = 'Condecoración'
        elif any(w in low for w in ['trench club', 'messer']): typ = 'Arma blanca'
        elif any(w in low for w in ['cap', 'pilotka']): typ = 'Prenda / gorra'
        else: typ = 'Equipo y accesorios'
        if n in ('Peony', 'Lavender'): typ = 'Objeto decorativo'; role = 'Decoración'; c = 'Sin atribuir'
        if n == 'Tutorial paper': typ = 'Papel del tutorial'; role = 'Archivo / almacén'; c = 'Sin atribuir'
    if r.get('damaged'):
        role = 'Reserva · irrecuperable'
    elif r.get('complete') is False and cat in ('Receivers', 'Helmets'):
        role = 'Proyecto · faltan piezas'
    sec = section(h, c, r, typ)
    if cat == 'Parts' and c == 'Compatibilidad compartida': sec = 'Repuestos de compatibilidad compartida'
    if c == 'Calibre de uso compartido': sec = 'Munición y accesorios de uso compartido'
    return {**r, 'display_selected': False, 'display_house': h, 'section': sec, 'national_family': c, 'family': fam,
            'piece_type': typ, 'display_role': role, 'era': era(r), 'classification_basis': basis}
