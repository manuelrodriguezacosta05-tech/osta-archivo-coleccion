local H=require('UEHelpers')
local base='__BASE__'
local function un(v)local ok,r=pcall(function()return v:get()end);if ok then return r end;return v end
local function valid(v)local ok,r=pcall(function()return v:IsValid()end);return ok and r end
local function txt(v)
 v=un(v);if type(v)=='string'then return v end
 local ok,r=pcall(function()return v:ToString()end);if ok then return r end
 ok,r=pcall(function()return v:GetFullName()end);if ok then return r end
 return tostring(v)
end
local function arr(v)local a={};if type(v)=='table'then for _,x in ipairs(v)do a[#a+1]=un(x)end elseif v then v:ForEach(function(_,x)a[#a+1]=un(x)end)end;return a end
local function json(v)
 if type(v)=='string'then return '"'..v:gsub('\\','\\\\'):gsub('"','\\"'):gsub('\n','\\n'):gsub('\r','\\r'):gsub('\t','\\t')..'"'end
 if type(v)=='number'or type(v)=='boolean'then return tostring(v)end
 if type(v)~='table'then return 'null'end
 local a={};if #v>0 then for _,x in ipairs(v)do a[#a+1]=json(x)end;return '['..table.concat(a,',')..']'end
 for k,x in pairs(v)do a[#a+1]=json(tostring(k))..':'..json(x)end;return '{'..table.concat(a,',')..'}'
end
local ids=dofile(base..'ids.lua');local data={};local index=0;local n=0
LoopAsync(250,function()
 n=n+1;if n<25 then return false end
 ExecuteInGameThread(function()
  local ok,e=pcall(function()
   local world=H.GetWorld();local lib=StaticFindObject('/Game/OstaFunctionLibrary.Default__OstaFunctionLibrary_C')
   for _=1,15 do
    index=index+1;local id=ids[index];if not id then return end
    if index==1 then print('[COLL] FIRST ID '..id..'\n')end
    local out={};lib:IDToItem(id,world,world,out)
    local c=out.Item;assert(valid(c),'unresolved '..id..' '..json(out))
    local d=c:GetCDO();local r={id=id,path=c:GetFullName(),name=txt(d.ItemName),slot=txt(d.PartSlotNumber),is_part=d.IsPart,types={},natural={}}
    for _,v in ipairs(arr(d.ItemTypes))do r.types[#r.types+1]=txt(v)end
    d.NaturalParts:ForEach(function(k,v)r.natural[#r.natural+1]={path=txt(k),weight=un(v)}end)
    data[tostring(id)]=r
   end
  end)
  local f=assert(io.open(base..'classes.json','w'));f:write(json(data));f:close()
  print('[COLL] CLASSES '..math.min(index,#ids)..' '..tostring(ok)..' '..tostring(e)..'\n')
 end)
 return index>=#ids
end)
