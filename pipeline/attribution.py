import re
country={};family={}
def assign(names,c,f=None):
 for n in names.split('|'):country[n]=c;family[n]=f or n
assign('Brown Bess|P53 Enfield|SMLE Mk III|Sten MKII|Lanchester MkI','Reino Unido / Commonwealth')
assign('M700|M1911A1|M1A1 Thompson|BAR|M1 Carbine|M1 Garand|M1D Garand|M3|M3A1|M24 SWS|M82A1M|M16A2|M16A4|M4 Carbine','Estados Unidos')
assign('Walther PP|P38|P08|LP 08|MP38|MP40|MP41|MP41R|Karabiner 98 kurz|Gewehr 98|Gewehr 98M|StG44|MG42|MG3|G3A3|Mauser Standardmodell|HK416','Alemania')
assign('TT|PM|APB|M1895|Fedorov|PPSh-41|Leningrad PPD40|PPS-43|DP-27|DPM|SVT-38|SVT-40|M1891|M91/30|M38|M44|PE Sniper|PEM Sniper|SKS|SVD|RPK|RPK-74|RPKS-74|AKM|AKMS|AK-74|AKS-74|AKS-74N|PKM|RPG-7V|RPG-7D','Rusia / URSS')
assign('Berdan No.2|Berdan No.2 Cavalry','Rusia imperial','Berdan II')
assign('M1910','Bélgica','Browning FN 1910')
assign('AMD-65','Hungría','AK / AMD-65');assign('PM md. 65|PSL','Rumanía');assign('VZ-58','Checoslovaquia')
assign('M76|Zastava M84|M70B1|M70AB2|M92','Yugoslavia / Serbia')
assign('Milled Type-56|Milled Type-56-1|Type-56-2|Type 69','China')
assign('AT-4','Suecia / sistema AT4')
assign('Jezail','Tradición afgana / regional','Jezail')
assign('Sako Hunting Mosin','Finlandia / adaptación civil','Mosin de caza')
assign('Frolovka|Shotgun Conversion Berdan No.2|TOZ-34|TOZ-123|IZh-43|MP-133|MP-153|VPO-101M','Rusia / URSS · uso civil')
assign('M1935','Por confirmar','Mosin · M1935 del juego')
assign('Stirnpanzer','Alemania','Blindaje para casco M16/M17')
assign('RGN|RG-42|Koveshnikov Fuze F1|TM-62|PNV-57E|Obr.88 Khaki Cap|4-cell AK74 Magazine Pouch|7.62x54mmR Target Ammo Box|5.45x39 Clip','Rusia / URSS')
assign('.303 Clip','Reino Unido / Commonwealth','Accesorios de munición .303')
assign('7.92x57mm Clip','Calibre de uso compartido','Accesorios de munición 7,92 × 57 mm')
for n in ['M1891','M91/30','M38','M44','PE Sniper','PEM Sniper']:family[n]='Mosin-Nagant'
for n in ['AKM','AKMS','AK-74','AKS-74','AKS-74N','RPK','RPK-74','RPKS-74','AMD-65','PM md. 65','M70B1','M70AB2','M92','Milled Type-56','Milled Type-56-1','Type-56-2']:family[n]='AK / RPK y derivados'
for n in ['MP38','MP40','MP41']:family[n]='MP38 / MP40 / MP41'
for n in ['M16A2','M16A4','M4 Carbine','HK416']:family[n]='AR-15 / M16 / M4 y derivados'
PISTOLS={'Walther PP','P38','P08','LP 08','M1910','M1911A1','TT','PM','APB'}
SMG={'M1A1 Thompson','Sten MKII','Lanchester MkI','MP38','MP40','MP41','MP41R','PPSh-41','Leningrad PPD40','PPS-43','M3','M3A1'}
MG={'BAR','MG42','MG3','DP-27','DPM','RPK','RPK-74','RPKS-74','PKM','Zastava M84'}
SHOTGUN={'Frolovka','Shotgun Conversion Berdan No.2','TOZ-34','TOZ-123','IZh-43','MP-133','MP-153'}
SNIPER={'PE Sniper','PEM Sniper','M1D Garand','M24 SWS','M82A1M','SVD','PSL','M76'}
LAUNCHERS={'AT-4','Panzerfaust 30','Panzerfaust 30 Klein','RPG-7V','RPG-7D','Type 69'}
assign('Panzerfaust 30|Panzerfaust 30 Klein','Alemania','Panzerfaust')

def region(name,path=''):
 if name in country:return country[name]
 s=(name+' '+path).lower()
 if any(w in s for w in ['m59','m70','m76','m84','zastava','bosnian','jna','serbian','pma-','prom-','tma-','m75']):return 'Yugoslavia / Balcanes'
 if any(w in s for w in ['french','france','chauchat']):return 'Francia'
 if 'russian imperial'in s:return 'Rusia imperial'
 if 'estonian'in s:return 'Estonia'
 if 'adrian'in s:return 'Por confirmar'
 if any(w in s for w in ['soviet','russian','ssh','mosin','berdan','fedorov','svd','svt','psh','pmg','gp-5','m1895','ppsh','ppd','frolov','toz','izh','vpo','ks-23','shvak','rpg','rgd','katyusha','pomos','pomz','vog-','dshk','pilotka','rdg-','rop-','sks','pkm','pk barrel','pk bolt','pk stock','pk ammo','pk dust']):return 'Rusia / URSS'
 if any(w in s for w in ['german','wehr','kar98','mg42','mg-42','stg44','luft','heer','polizei','kriegsmarine','pickelhaube','erel','vulkanfiber','m16painted','m16.m16','m18','iron cross','war merit','eihand','eierhand','kugel','zeitzunder','betonmine','s-mine','panzerfaust','mk108','sd15','sd70','puw','mp40','mp41','g3','s98','ersatz']):return 'Alemania'
 if any(w in s for w in ['smle','sten','lanchester','brodie','no.68','no.69','brown bess','pattern1853']):return 'Reino Unido / Commonwealth'
 if re.search(r'\bbar\b',s) or any(w in s for w in ['m1 carbine','m1 garand','m1d','m1911','m1a1','thompson','ar15','ar-15','stanag','m16a','m4 ','m24 ','m82','m9 ','m1 helmet','pasgt','m67','m1942 canteen','m1910 canteen','m9a1','m6a1','mk2 grenade','mk3a']):return 'Estados Unidos'
 if any(w in s for w in ['type-56','type 69','chinese']):return 'China'
 if any(w in s for w in ['vz-58','vz58']):return 'Checoslovaquia'
 if 'amd65'in s or'amd-65'in s:return 'Hungría'
 if any(w in s for w in ['ak ','akm','aks','rpk','6h4','6h5']):return 'URSS / variantes compartidas'
 if 'hookah'in s:return 'Tradición regional · sin atribuir'
 return 'Sin atribuir'

