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
local jobs=dofile(base..'jobs.lua');local results={};local templates={};local cache={};local index=0;local ticks=0
local function cls(id)
 if cache[id]then return cache[id]end
 local out={};local world=H.GetWorld()
 StaticFindObject('/Game/OstaFunctionLibrary.Default__OstaFunctionLibrary_C'):IDToItem(id,world,world,out)
 assert(valid(out.Item),'unknown class '..id);cache[id]=out.Item;return out.Item
end
local function evaluate(job)
 local world=H.GetWorld();local lib=StaticFindObject('/Game/OstaFunctionLibrary.Default__OstaFunctionLibrary_C')
 local item=world:SpawnActor(cls(job.ID),{X=0,Y=0,Z=-100000},{})
 assert(valid(item),'spawn failed '..job.key)
 local r={key=job.key,attached={},rejected={},slots={}}
 for _,id in ipairs(job.parts)do
  local out={};item:AddPartToTarget(item,cls(id),false,false,out)
  if out.AddedPart~=true then r.rejected[#r.rejected+1]=id end
 end
 -- Reproduce the saved class array directly, including already mounted parts
 -- which the current attachment compatibility filter may refuse to add anew.
 local saved={};for _,id in ipairs(job.parts)do saved[#saved+1]=cls(id)end
 item.AttachedParts=saved
 item:SetPartsVisible()
 for _,c in ipairs(arr(item.AttachedParts))do r.attached[#r.attached+1]=c:GetFullName()end
 for _,c in ipairs(arr(item:K2_GetComponentsByClass(StaticFindObject('/Script/Engine.StaticMeshComponent'))))do
  local tags={};local ispart=false
  for _,t in ipairs(arr(c.ComponentTags))do local s=txt(t);tags[#tags+1]=s;if s=='Part'then ispart=true end end
  if ispart then r.slots[#r.slots+1]={name=c:GetFName():ToString(),tags=tags,has_mesh=valid(c.StaticMesh)}end
 end
 local complete,missing={},{};lib:CheckComplete(item,world,complete,missing)
 r.complete=complete.IsComplete;r.missing_native={}
 for _,v in ipairs(arr(missing))do r.missing_native[#r.missing_native+1]=txt(v)end
 local original={};local ok,e=pcall(function()lib:CheckOriginal(item,world,original)end)
 r.original_check=ok;r.original_error=ok and nil or tostring(e)
 if ok then
  for k,v in pairs(original)do if type(v)=='boolean'then r[k]=v end end
 end
 local path=cls(job.ID):GetFullName()
 if not templates[tostring(job.ID)]then
  local natural={};item.NaturalParts:ForEach(function(k,v)
   local c=un(k);local d=c:GetCDO()
   natural[#natural+1]={path=c:GetFullName(),name=txt(d.ItemName),slot=txt(d.PartSlotNumber),weight=un(v)}
  end)
  templates[tostring(job.ID)]={path=path,slots=r.slots,natural=natural}
 end
 item:K2_DestroyActor();results[job.key]=r
end
LoopAsync(250,function()
 ticks=ticks+1;if ticks<20 then return false end
 if ticks==20 then ExecuteInGameThread(function()H.GetGameplayStatics():OpenLevel(H.GetWorld(),FName('/Game/TestLevel'),true,'')end);return false end
 if ticks<44 then return false end
 ExecuteInGameThread(function()
  local ok,e=pcall(function()
   assert(H.GetWorld():GetFullName():find('/Game/TestLevel',1,true),'wrong test world')
   for _=1,8 do index=index+1;local job=jobs[index];if not job then return end;evaluate(job)end
  end)
  local f=assert(io.open(base..'evaluations.json','w'));f:write(json({results=results,templates=templates}));f:close()
  print('[COLL] EVALUATED '..math.min(index,#jobs)..' '..tostring(ok)..' '..tostring(e)..'\n')
 end)
 return index>=#jobs
end)
