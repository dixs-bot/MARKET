/* FIX #9 — Global error handler */
window.onerror = function(msg, url, line) {
    console.error("APP ERROR:", msg, "LINE:", line);
    return true;
};

(function(){
'use strict';

/* ========== DATA — ID string (aman Firebase) ========== */
var CATS=[
{id:'all',name:'Semua',emoji:'&#127979;'},
{id:'snacks',name:'Snack',emoji:'&#127871;'},
{id:'drinks',name:'Minuman',emoji:'&#129364;'},
{id:'dairy',name:'Susu',emoji:'&#129371;'},
{id:'frozen',name:'Frozen',emoji:'&#129374;'},
{id:'instant',name:'Mie',emoji:'&#127836;'}
];

var PRODS=[
{id:"p1",name:'Chitato Original 68g',price:12000,cat:'snacks',stock:50,img:'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop'},
{id:"p2",name:'Lays BBQ 70g',price:11000,cat:'snacks',stock:45,img:'https://images.unsplash.com/photo-1585232004423-244e01769049?w=300&h=300&fit=crop'},
{id:"p3",name:'Oreo Original 133g',price:15000,cat:'snacks',stock:30,img:'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=300&h=300&fit=crop'},
{id:"p4",name:'Good Day Kopi 250ml',price:5000,cat:'drinks',stock:100,img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d92a?w=300&h=300&fit=crop'},
{id:"p5",name:'Teh Pucuk 350ml',price:4000,cat:'drinks',stock:80,img:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop'},
{id:"p6",name:'Aqua 600ml',price:4000,cat:'drinks',stock:120,img:'https://images.unsplash.com/photo-1548839140-29a749e1f16a?w=300&h=300&fit=crop'},
{id:"p7",name:'Indomie Goreng',price:3500,cat:'instant',stock:200,img:'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=300&fit=crop'},
{id:"p8",name:'Ultra Milk 1L',price:18000,cat:'dairy',stock:40,img:'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop'},
{id:"p9",name:'Yogurt Strawberry 250ml',price:8000,cat:'dairy',stock:60,img:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop'},
{id:"p10",name:'Nugget Ayam 500g',price:45000,cat:'frozen',stock:25,img:'https://images.unsplash.com/photo-1606525437679-0374ed4ffb3b?w=300&h=300&fit=crop'},
{id:"p11",name:'Sosis Ayam 250g',price:28000,cat:'frozen',stock:35,img:'https://images.unsplash.com/photo-1612283818218-bc7cb1edb2f6?w=300&h=300&fit=crop'},
{id:"p12",name:'Sunlight 800ml',price:14000,cat:'snacks',stock:55,img:'https://images.unsplash.com/photo-1583947215259-38e4be8c7b99?w=300&h=300&fit=crop'}
];

var SHIPS=[
{id:'gojek',name:'Gojek Instant',price:15000,est:'1-2 jam',emoji:'&#128669;'},
{id:'grab',name:'Grab Instant',price:15000,est:'1-2 jam',emoji:'&#128872;'},
{id:'shopee',name:'Shopee Express',price:9000,est:'2-3 hari',emoji:'&#128230;'},
{id:'pickup',name:'Ambil di Tempat',price:0,est:'Langsung',emoji:'&#127979;'}
];

var PAYS=[
{id:'cod',name:'COD (Bayar di Tempat)',desc:'Bayar saat tiba',emoji:'&#128181;'},
{id:'transfer',name:'Transfer Bank',desc:'BCA, Mandiri, BRI',emoji:'&#127974;'},
{id:'qris',name:'QRIS',desc:'Scan QR bayar',emoji:'&#128247;'}
];

var VOUS=[
{id:1,code:'HEMAT10K',disc:10000,type:'nominal',min:50000},
{id:2,code:'HEMAT5K',disc:5000,type:'nominal',min:30000},
{id:3,code:'DISKON20K',disc:20000,type:'nominal',min:100000}
];

var WA='6285189976233';
var FREE_SHIP_MIN=50000;
var MAX_CART=100;

/* FIX #4 — fallback image URL */
var FALLBACK_IMG='https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image';

var SVG_MI='<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>';
var SVG_PL='<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>';
var SVG_TR='<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>';

/* ========== STATE ========== */
var cart=[],orders=[],selCat='all';
var co={ship:'',pay:'',vou:null};
var curOrder=null,lockCnt=0,tTimer=null;
var currentPage='home';

/* FIX #1 — cegah double order */
var isProcessing=false;

/* ========== DOM CACHE ========== */
var d={};
function cache(){
var g=function(id){return document.getElementById(id)};
d.dim=g('dim');d.csheet=g('cart-sheet');d.clist=g('cart-list');
d.cnone=g('cart-none');d.cft=g('cart-ft');d.ccnt=g('cart-cnt');
d.ctotal=g('cart-total');d.fab=g('fab-cart');d.badge=g('cart-badge');
d.catbar=g('cat-bar');d.pgrid=g('prod-grid');d.pcnt=g('prod-cnt');
d.pgco=g('pg-checkout');d.coscroll=g('checkout-scroll');d.inaddr=g('in-addr');d.innote=g('in-note');
d.eaddr=g('err-addr');d.eship=g('err-ship');d.epay=g('err-pay');
d.ships=g('ship-opts');d.pays=g('pay-opts');d.freebanner=g('free-ship-banner');
d.coitems=g('co-items');d.ssub=g('s-sub');d.sship=g('s-ship');
d.discr=g('s-disc-row');d.sdisc=g('s-disc');d.stotal=g('s-total');
d.vlbl=g('v-label');d.border=g('btn-order');d.hint=g('co-hint');
d.mconf=g('m-confirm');d.mload=g('m-loading');
d.pginv=g('pg-invoice');d.invbody=g('inv-body');d.bwa=g('btn-wa');
d.pgsearch=g('pg-search');d.insearch=g('in-search');d.sres=g('search-res');
d.pgvou=g('pg-vou');d.vlist=g('vou-list');
d.olist=g('ord-list');d.oempty=g('ord-empty');
d.toast=g('toast');
}

/* ========== UTILITAS ========== */
function fmt(p){return 'Rp '+((p||0)).toLocaleString('id-ID');}

function notify(m){
if(tTimer)clearTimeout(tTimer);
d.toast.textContent=m;d.toast.classList.add('show');
tTimer=setTimeout(function(){d.toast.classList.remove('show')},2200);
}

function findProd(id){for(var i=0;i<PRODS.length;i++)if(PRODS[i].id===id)return PRODS[i];return null;}
function findCart(id){for(var i=0;i<cart.length;i++)if(cart[i].id===id)return{it:cart[i],i:i};return null;}
function subTotal(){var t=0;for(var i=0;i<cart.length;i++)t+=cart[i].price*cart[i].qty;return t;}
function cartQty(){var c=0;for(var i=0;i<cart.length;i++)c+=cart[i].qty;return c;}

function lock(){if(!lockCnt)document.body.style.overflow='hidden';lockCnt++;}
function unlock(){lockCnt=Math.max(0,lockCnt-1);if(!lockCnt)document.body.style.overflow='';}

/* FIX #3 — localStorage fallback aman */
function load(){
try{
var c=localStorage.getItem('mc3');
var o=localStorage.getItem('mo3');
cart=c?JSON.parse(c):[];
orders=o?JSON.parse(o):[];
}catch(e){
console.error('Storage corrupt, reset:',e);
cart=[];orders=[];
try{localStorage.removeItem('mc3');localStorage.removeItem('mo3');}catch(x){}
}
}
function save(){try{localStorage.setItem('mc3',JSON.stringify(cart));localStorage.setItem('mo3',JSON.stringify(orders));}catch(e){}}

function patchQty(pid,isSearch){
var pre=isSearch?'sq':'pq',el=document.getElementById(pre+'-'+pid);
if(!el)return;var f=findCart(pid);el.innerHTML=qtyHTML(pid,f?f.it.qty:0,isSearch);
}

function patchBadge(){
var c=cartQty();d.badge.textContent=c;
if(c>0){d.fab.classList.remove('hidden');d.badge.classList.remove('pop');void d.badge.offsetWidth;d.badge.classList.add('pop');}
else d.fab.classList.add('hidden');
}

function qtyHTML(pid,qty,isSearch){
var a=isSearch?'data-sa':'data-a',m=isSearch?'data-sm':'data-m',p=isSearch?'data-sp':'data-p';
if(qty>0)return '<div class="flex items-center justify-between bg-blue-50 rounded-xl p-0.5"><button '+m+'="'+pid+'" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center tap">'+SVG_MI+'</button><span class="font-bold text-blue-600 text-base">'+qty+'</span><button '+p+'="'+pid+'" class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center tap">'+SVG_PL+'</button></div>';
return '<button '+a+'="'+pid+'" class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold tap">+ Tambah</button>';
}

/* FIX #6 — limit cart 100 item, FIX #5 — cek stok keras */
function addCart(pid,delta){
/* FIX #6 */
if(cart.length>=MAX_CART){notify('Keranjang penuh (maks '+MAX_CART+' item)');return;}
var prod=findProd(pid);if(!prod)return;
var f=findCart(pid),cur=f?f.it.qty:0;
if(delta>0){
/* FIX #5 — cek stok tanpa bergantung pada delta */
if(cur>=prod.stock){notify('Stok habis');return;}
}
if(f){f.it.qty+=delta;if(f.it.qty<=0)cart.splice(f.i,1);}
else if(delta>0)cart.push({id:prod.id,name:prod.name,price:prod.price,img:prod.img,qty:1});
save();patchQty(pid,false);patchQty(pid,true);
if(d.csheet.classList.contains('open'))renderCart();
patchBadge();
}

function delCart(pid){
var f=findCart(pid);if(f)cart.splice(f.i,1);
save();renderCart();patchQty(pid,false);patchBadge();
if(!cart.length)closeCart();
}

function renderCats(){
var h='';
for(var i=0;i<CATS.length;i++){
var c=CATS[i],on=selCat===c.id;
h+='<div data-cat="'+c.id+'" class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" style="min-width:56px"><div class="rounded-full flex items-center justify-center text-xl transition-colors '+(on?'bg-blue-600':'bg-slate-100')+'" style="width:52px;height:52px">'+c.emoji+'</div><span class="text-[10px] font-semibold transition-colors '+(on?'text-blue-600':'text-slate-400')+'">'+c.name+'</span></div>';
}
d.catbar.innerHTML=h;
}

/* FIX #4 — onerror pakai placeholder image */
function renderCard(prod,isSearch){
var pre=isSearch?'sq':'pq',f=findCart(prod.id),qty=f?f.it.qty:0;
return '<div class="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100"><div class="aspect-square bg-slate-100 overflow-hidden"><img src="'+prod.img+'" alt="'+prod.name+'" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null;this.src=\''+FALLBACK_IMG+'\'"></div><div class="p-2.5"><h3 class="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug">'+prod.name+'</h3><p class="text-blue-600 font-bold text-xs mt-1">'+fmt(prod.price)+'</p><div id="'+pre+'-'+prod.id+'" class="mt-1.5">'+qtyHTML(prod.id,qty,isSearch)+'</div></div></div>';
}

function renderProds(){
var list=PRODS;
if(selCat!=='all'){list=[];for(var i=0;i<PRODS.length;i++)if(PRODS[i].cat===selCat)list.push(PRODS[i]);}
d.pcnt.textContent=list.length+' item';
if(!list.length){d.pgrid.innerHTML='<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Tidak ada produk</p></div>';return;}
var h='';for(var i=0;i<list.length;i++)h+=renderCard(list[i],false);
d.pgrid.innerHTML=h;
}

function renderCart(){
var cnt=cartQty();d.ccnt.textContent=cnt+' item';
if(!cart.length){d.clist.classList.add('hidden');d.cnone.classList.remove('hidden');d.cft.classList.add('hidden');return;}
d.clist.classList.remove('hidden');d.cnone.classList.add('hidden');d.cft.classList.remove('hidden');
var h='';
for(var i=0;i<cart.length;i++){
var it=cart[i];
h+='<div class="flex gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100"><img src="'+it.img+'" class="w-14 h-14 rounded-lg object-cover bg-white" loading="lazy" onerror="this.onerror=null;this.src=\''+FALLBACK_IMG+'\'"><div class="flex-1 min-w-0"><p class="text-xs font-medium text-slate-800 line-clamp-2">'+it.name+'</p><p class="text-blue-600 font-bold text-xs mt-0.5">'+fmt(it.price)+'</p><div class="flex items-center gap-1.5 mt-1"><button data-cm="'+it.id+'" class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center tap">'+SVG_MI+'</button><span class="text-xs font-semibold w-5 text-center text-slate-800">'+it.qty+'</span><button data-cp="'+it.id+'" class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center tap">'+SVG_PL+'</button></div></div><button data-cr="'+it.id+'" class="text-red-300 self-start tap p-0.5">'+SVG_TR+'</button></div>';
}
d.clist.innerHTML=h;d.ctotal.textContent=fmt(subTotal());
}

function renderShips(){
var sub=subTotal(),autoFree=sub>=FREE_SHIP_MIN;
if(autoFree)d.freebanner.classList.remove('hidden');else d.freebanner.classList.add('hidden');
var h='';
for(var i=0;i<SHIPS.length;i++){
var m=SHIPS[i],sel=co.ship===m.id,dp=autoFree?0:m.price,pt=dp===0?'Gratis':fmt(dp),pc=dp===0?'text-green-600':'text-slate-700';
h+='<div data-ship="'+m.id+'" class="sel flex items-center gap-2.5 p-3 rounded-xl border-2 '+(sel?'on border-blue-500 bg-blue-50/50':'border-slate-200 bg-white')+'"><span class="text-lg">'+m.emoji+'</span><div class="flex-1"><p class="text-xs font-semibold text-slate-800">'+m.name+'</p><p class="text-[10px] text-slate-400">'+m.est+'</p></div><span class="text-xs font-semibold '+pc+'">'+pt+'</span></div>';
}
d.ships.innerHTML=h;
}

function renderPays(){
var h='';
for(var i=0;i<PAYS.length;i++){
var m=PAYS[i],sel=co.pay===m.id;
h+='<div data-pay="'+m.id+'" class="sel flex items-center gap-2.5 p-3 rounded-xl border-2 '+(sel?'on border-blue-500 bg-blue-50/50':'border-slate-200 bg-white')+'"><span class="text-lg">'+m.emoji+'</span><div class="flex-1"><p class="text-xs font-semibold text-slate-800">'+m.name+'</p><p class="text-[10px] text-slate-400">'+m.desc+'</p></div></div>';
}
d.pays.innerHTML=h;
}

/* Validasi voucher ketat */
function renderSummary(){
var sub=subTotal(),autoFree=sub>=FREE_SHIP_MIN,shipM=null;
for(var i=0;i<SHIPS.length;i++)if(SHIPS[i].id===co.ship){shipM=SHIPS[i];break;}
var baseShip=shipM?shipM.price:0,finalShip=autoFree?0:baseShip;
var disc=0;
if(co.vou){
if(sub>=co.vou.min){disc=co.vou.disc;}
else{co.vou=null;d.vlbl.textContent='Opsional';}
}
var total=Math.max(0,sub+finalShip-disc);
var ih='';for(var i=0;i<cart.length;i++){var it=cart[i];ih+='<div class="flex justify-between text-[11px]"><span class="text-slate-600 truncate flex-1">'+it.name+'</span><span class="text-slate-400 ml-1">x'+it.qty+'</span><span class="text-slate-700 font-medium ml-2">'+fmt(it.price*it.qty)+'</span></div>';}
d.coitems.innerHTML=ih;d.ssub.textContent=fmt(sub);
d.sship.textContent=(finalShip===0&&shipM)?'Gratis':fmt(finalShip);
if(disc>0){d.discr.classList.remove('hidden');d.sdisc.textContent='-'+fmt(disc);}else d.discr.classList.add('hidden');
d.stotal.textContent=fmt(total);
}

function renderVou(){
var sub=subTotal(),h='';
for(var i=0;i<VOUS.length;i++){
var v=VOUS[i],ok=sub>=v.min,sel=co.vou&&co.vou.id===v.id;
h+='<div data-vou="'+v.id+'" class="border-2 rounded-xl p-3.5 transition-all '+(sel?'border-blue-500 bg-blue-50/50':ok?'border-slate-200 bg-white cursor-pointer':'border-slate-100 bg-slate-50 opacity-50')+'"><div class="flex items-center justify-between mb-1"><span class="text-xs font-bold text-blue-600">'+v.code+'</span>'+(sel?'<span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Dipilih</span>':'')+'</div><p class="text-xs font-semibold text-slate-800">Diskon '+fmt(v.disc)+'</p><p class="text-[10px] text-slate-400 mt-0.5">Min. belanja '+fmt(v.min)+'</p>'+(!ok?'<p class="text-[10px] text-red-500 mt-1 font-medium">Belum memenuhi minimum</p>':'')+'</div>';
}
d.vlist.innerHTML=h;
}

function renderInv(){
var o=curOrder;if(!o)return;var ih='';
for(var i=0;i<o.items.length;i++){var it=o.items[i];ih+='<div class="flex items-center gap-2.5"><img src="'+it.img+'" class="w-10 h-10 rounded-lg object-cover bg-white" onerror="this.onerror=null;this.src=\''+FALLBACK_IMG+'\'"><div class="flex-1 min-w-0"><p class="text-xs font-medium text-slate-800 truncate">'+it.name+'</p><p class="text-[10px] text-slate-400">'+it.qty+'x '+fmt(it.price)+'</p></div><span class="text-xs font-semibold text-slate-800">'+fmt(it.price*it.qty)+'</span></div>';}
var sl=o.status.charAt(0).toUpperCase()+o.status.slice(1);
var payName=o.payment?o.payment.name:'-';
d.invbody.innerHTML='<div class="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white text-center"><div class="text-3xl mb-1">&#10003;</div><h2 class="text-base font-bold">Pesanan Berhasil</h2><p class="text-xs opacity-80 mt-0.5">#'+o.id+'</p></div><div class="p-4 border-b border-slate-100"><div class="flex justify-between items-center"><span class="text-[10px] text-slate-400">Status</span><span class="st-'+o.status+' text-[10px] font-semibold px-2.5 py-0.5 rounded-full">'+sl+'</span></div></div><div class="p-4 border-b border-slate-100"><p class="text-xs font-semibold text-slate-800 mb-2">Detail Pesanan</p><div class="space-y-2">'+ih+'</div></div><div class="p-4 border-b border-slate-100 space-y-1.5 text-[11px]"><div class="flex justify-between"><span class="text-slate-400">Subtotal</span><span class="text-slate-700">'+fmt(o.subtotal)+'</span></div><div class="flex justify-between"><span class="text-slate-400">Ongkir</span><span class="'+(o.shipPrice===0?'text-green-600 font-medium':'text-slate-700')+'">'+(o.shipPrice===0?'Gratis':fmt(o.shipPrice))+'</span></div>'+(o.discount>0?'<div class="flex justify-between"><span class="text-slate-400">Diskon</span><span class="text-green-600 font-medium">-'+fmt(o.discount)+'</span></div>':'')+'<div class="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold"><span>Total</span><span class="text-blue-600">'+fmt(o.total)+'</span></div></div><div class="p-4 border-b border-slate-100"><p class="text-xs font-semibold text-slate-800 mb-1">Alamat</p><p class="text-[11px] text-slate-500">'+o.address+'</p></div><div class="p-4"><p class="text-xs font-semibold text-slate-800 mb-1">Pembayaran</p><p class="text-[11px] text-slate-500">'+payName+'</p></div>';
}

function renderOrders(){
if(!orders.length){d.olist.classList.add('hidden');d.oempty.classList.remove('hidden');return;}
d.olist.classList.remove('hidden');d.oempty.classList.add('hidden');
var h='';
for(var i=orders.length-1;i>=0;i--){
var o=orders[i],sl=o.status.charAt(0).toUpperCase()+o.status.slice(1),prev='',mx=Math.min(o.items.length,2);
for(var j=0;j<mx;j++){var it=o.items[j];prev+='<div class="flex items-center gap-2"><img src="'+it.img+'" class="w-8 h-8 rounded-lg object-cover bg-slate-100" onerror="this.onerror=null;this.src=\''+FALLBACK_IMG+'\'"><div class="flex-1 min-w-0"><p class="text-[11px] font-medium text-slate-800 truncate">'+it.name+'</p><p class="text-[10px] text-slate-400">'+it.qty+'x '+fmt(it.price)+'</p></div></div>';}
if(o.items.length>2)prev+='<p class="text-[10px] text-slate-400">+'+(o.items.length-2)+' lainnya</p>';
h+='<div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-100"><div class="flex justify-between mb-2"><span class="text-[10px] text-slate-400">#'+o.id+'</span><span class="st-'+o.status+' text-[10px] font-semibold px-2.5 py-0.5 rounded-full">'+sl+'</span></div><div class="space-y-1.5 mb-2">'+prev+'</div><div class="flex justify-between pt-2 border-t border-slate-200"><span class="text-sm font-bold text-blue-600">'+fmt(o.total)+'</span><button data-odet="'+o.id+'" class="text-blue-600 text-[11px] font-semibold tap">Detail</button></div></div>';
}
d.olist.innerHTML=h;
}

function selShip(id){co.ship=id;renderShips();validate(false);renderSummary();}
function selPay(id){co.pay=id;renderPays();validate(false);}

function selVou(vid){
var v=null;for(var i=0;i<VOUS.length;i++)if(VOUS[i].id===vid){v=VOUS[i];break;}
if(co.vou&&co.vou.id===vid){co.vou=null;d.vlbl.textContent='Opsional';}
else{co.vou=v;if(v)d.vlbl.textContent=v.code+' (-'+fmt(v.disc)+')';}
closeVou();renderSummary();
}

/* FIX #2 — validasi alamat minimal 10 karakter */
function validate(showErr){
var a=d.inaddr.value.trim().length>=10,s=co.ship!=='',p=co.pay!=='',ok=a&&s&&p;
if(ok){d.border.disabled=false;d.border.classList.remove('btn-off');d.border.classList.add('btn-on');d.hint.textContent='Siap pesan';}
else{d.border.disabled=true;d.border.classList.add('btn-off');d.border.classList.remove('btn-on');d.hint.textContent='Lengkapi semua data';}
if(showErr!==true)return ok;
d.eaddr.classList.toggle('hidden',a);d.eship.classList.toggle('hidden',s);d.epay.classList.toggle('hidden',p);
d.inaddr.classList.toggle('err-input',!a);return ok;
}

function resetCO(){co.ship='';co.pay='';co.vou=null;}

function animateIn(el){el.classList.remove('page-in');void el.offsetWidth;el.classList.add('page-in');}

function goToHome(){d.pginv.classList.add('hidden');unlock();currentPage='home';curOrder=null;navTo('home');}

function goToCart(){
d.pgco.classList.add('hidden');d.mconf.classList.add('hidden');
renderCart();d.csheet.classList.add('open');d.dim.classList.add('on');currentPage='cart';
}

function goToCheckout(){
if(!cart.length){notify('Keranjang kosong');return;}
d.csheet.classList.remove('open');d.dim.classList.remove('on');
if(lockCnt===0)lock();
if(currentPage!=='confirm'){
resetCO();d.inaddr.value='';d.innote.value='';d.vlbl.textContent='Opsional';
d.eaddr.classList.add('hidden');d.eship.classList.add('hidden');d.epay.classList.add('hidden');
d.inaddr.classList.remove('err-input');
}
renderShips();renderPays();renderSummary();validate(false);
d.pgco.classList.remove('hidden');
if(d.coscroll)d.coscroll.scrollTop=0;
if(d.coscroll)animateIn(d.coscroll);
currentPage='checkout';
}

function goToConfirm(){
if(!validate(true)){notify('Lengkapi data!');return;}
d.mconf.classList.remove('hidden');currentPage='confirm';
}

function backToCheckout(){d.mconf.classList.add('hidden');currentPage='checkout';}

/* FIX #1 #7 — isProcessing + disabled check */
/* FIX #2 — renderCart + renderProds setelah order */
function goToInvoice(){
/* FIX #7 — hard block jika tombol disabled */
if(isProcessing)return;
if(d.border.disabled)return;
isProcessing=true;
d.mconf.classList.add('hidden');
d.mload.classList.remove('hidden');

setTimeout(function(){
try{
var sm=null,pm=null;
for(var i=0;i<SHIPS.length;i++)if(SHIPS[i].id===co.ship){sm=SHIPS[i];break;}
for(var i=0;i<PAYS.length;i++)if(PAYS[i].id===co.pay){pm=PAYS[i];break;}
var sub=subTotal(),autoFree=sub>=FREE_SHIP_MIN;
var baseShip=sm?sm.price:0,finalShip=autoFree?0:baseShip,disc=0;
if(co.vou&&sub>=co.vou.min)disc=co.vou.disc;
var total=Math.max(0,sub+finalShip-disc);

/* FIX #1 — order ID unik dengan random suffix */
curOrder={
id:'ord_'+Date.now()+'_'+Math.random().toString(36).substr(2,5),
items:cart.slice(),
address:d.inaddr.value.trim(),
shipping:sm,payment:pm,
subtotal:sub,shipPrice:finalShip,discount:disc,
total:total,notes:d.innote.value.trim(),
status:'diproses'
};

orders.push(curOrder);
cart=[];
resetCO();
save();

/* FIX #2 — reset UI setelah order */
renderCart();
renderProds();
patchBadge();

d.mload.classList.add('hidden');
d.pgco.classList.add('hidden');
renderInv();
d.pginv.classList.remove('hidden');
d.pginv.scrollTop=0;
animateIn(d.pginv);
currentPage='invoice';
}catch(err){
console.error('Order error:',err);
d.mload.classList.add('hidden');
notify('Gagal memproses pesanan');
}finally{
isProcessing=false;
}
},600);
}

function openCart(){
if(!cart.length){notify('Keranjang kosong');return;}
renderCart();d.csheet.classList.add('open');d.dim.classList.add('on');lock();currentPage='cart';
}
function closeCart(){d.csheet.classList.remove('open');d.dim.classList.remove('on');unlock();currentPage='home';}
function openVou(){renderVou();d.pgvou.classList.remove('hidden');lock();}
function closeVou(){d.pgvou.classList.add('hidden');unlock();}
function openSearch(){
d.pgsearch.classList.remove('hidden');d.insearch.value='';
/* FIX #9 — tampilkan loading state */
d.sres.innerHTML='<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Mencari...</p></div>';
lock();setTimeout(function(){d.insearch.focus()},80);
}
function closeSearch(){d.pgsearch.classList.add('hidden');unlock();}

/* FIX #6 — WA di APK pakai location.href */
function sendWA(){
if(!curOrder){notify('Pesanan tidak ditemukan');return;}
var o=curOrder,t='Halo, saya ingin pesan:\n\n';
for(var i=0;i<o.items.length;i++){var it=o.items[i];t+='- '+it.name+' x'+it.qty+'\n';}
t+='\nAlamat:\n'+o.address+'\n\nPengiriman:\n'+o.shipping.name+'\n';
if(o.discount>0)t+='Diskon: '+fmt(o.discount)+'\n';
t+='\nTotal:\n'+fmt(o.total);
var url='https://wa.me/'+WA+'?text='+encodeURIComponent(t);
if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
window.location.href=url;
}else{
window.open(url,'_blank');
}
}

/* FIX #3 — debounce search 250ms */
function doSearch(q){
q=q.toLowerCase().trim();
if(!q){d.sres.innerHTML='<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Ketik untuk cari</p></div>';return;}
var res=[];for(var i=0;i<PRODS.length;i++)if(PRODS[i].name.toLowerCase().indexOf(q)!==-1)res.push(PRODS[i]);
if(!res.length){d.sres.innerHTML='<div class="col-span-2 text-center py-10"><p class="text-xs text-slate-400">Tidak ditemukan</p></div>';return;}
var h='';for(var i=0;i<res.length;i++)h+=renderCard(res[i],true);
d.sres.innerHTML=h;
}

function navTo(name){
var pages=document.querySelectorAll('.page');
for(var i=0;i<pages.length;i++)pages[i].classList.remove('on');
var el=document.getElementById('pg-'+name);if(el)el.classList.add('on');
var btns=document.querySelectorAll('[data-nav]');
for(var i=0;i<btns.length;i++){var on=btns[i].getAttribute('data-nav')===name;btns[i].classList.toggle('text-blue-600',on);btns[i].classList.toggle('text-slate-400',!on);}
if(name==='history')renderOrders();
window.scrollTo(0,0);
}

function viewDetail(oid){
var o=null;for(var i=0;i<orders.length;i++)if(String(orders[i].id)===String(oid)){o=orders[i];break;}
if(!o){notify('Tidak ditemukan');return;}
curOrder=o;renderInv();d.pginv.classList.remove('hidden');d.pginv.scrollTop=0;lock();animateIn(d.pginv);currentPage='invoice';
}

function initInputListeners(){
d.inaddr.addEventListener('input',function(){d.eaddr.classList.add('hidden');d.inaddr.classList.remove('err-input');validate(false);});

/* FIX #3 — debounce search 250ms */
var searchTimer=null;
d.insearch.addEventListener('input',function(){
clearTimeout(searchTimer);
var val=this.value;
searchTimer=setTimeout(function(){
doSearch(val);
},250);
});
}

function init(){
cache();load();initInputListeners();
renderCats();renderProds();patchBadge();navTo('home');currentPage='home';
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();

/* FIX #5 — scroll lock failsafe setiap 3 detik */
setInterval(function(){
if(lockCnt>3){
console.warn('Scroll lock stuck at',lockCnt,', force unlock');
lockCnt=0;
document.body.style.overflow='';
}
},3000);

/* ====================================================================
   GLOBAL CLICK HANDLER — LENGKAP
   FIX #10 — ID string, TANPA parseInt()
   FIX #7 — hard block disabled tombol
   ==================================================================== */
document.addEventListener("click", function(e) {

    var el;

    /* ADD TO CART: home grid */
    el = e.target.closest("[data-a]");
    if (el) { addCart(el.dataset.a, 1); return; }

    /* ADD TO CART: search grid */
    el = e.target.closest("[data-sa]");
    if (el) { addCart(el.dataset.sa, 1); return; }

    /* PLUS: home grid */
    el = e.target.closest("[data-p]");
    if (el) { addCart(el.dataset.p, 1); return; }

    /* PLUS: search grid */
    el = e.target.closest("[data-sp]");
    if (el) { addCart(el.dataset.sp, 1); return; }

    /* PLUS: cart sheet */
    el = e.target.closest("[data-cp]");
    if (el) { addCart(el.dataset.cp, 1); return; }

    /* MINUS: home grid */
    el = e.target.closest("[data-m]");
    if (el) { addCart(el.dataset.m, -1); return; }

    /* MINUS: search grid */
    el = e.target.closest("[data-sm]");
    if (el) { addCart(el.dataset.sm, -1); return; }

    /* MINUS: cart sheet */
    el = e.target.closest("[data-cm]");
    if (el) { addCart(el.dataset.cm, -1); return; }

    /* HAPUS: cart sheet — FIX #10, tanpa parseInt */
    el = e.target.closest("[data-cr]");
    if (el) { delCart(el.dataset.cr); return; }

    /* KATEGORI */
    el = e.target.closest("[data-cat]");
    if (el) { selCat = el.dataset.cat; renderCats(); renderProds(); return; }

    /* BOTTOM NAV */
    el = e.target.closest("[data-nav]");
    if (el) { navTo(el.dataset.nav); return; }

    /* FAB CART */
    if (e.target.closest("#fab-cart")) { openCart(); return; }

    /* CLOSE CART */
    if (e.target.closest("[data-act='close-cart']")) { closeCart(); return; }

    /* CHECKOUT */
    if (e.target.closest("[data-act='checkout']")) { goToCheckout(); return; }

    /* BACK TO CART */
    if (e.target.closest("[data-act='back-to-cart']")) { goToCart(); return; }

    /* SHIPPING */
    el = e.target.closest("[data-ship]");
    if (el) { selShip(el.dataset.ship); return; }

    /* PAYMENT */
    el = e.target.closest("[data-pay]");
    if (el) { selPay(el.dataset.pay); return; }

    /* OPEN VOUCHER */
    if (e.target.closest("[data-act='open-vou']")) { openVou(); return; }

    /* CLOSE VOUCHER */
    if (e.target.closest("[data-act='close-vou']")) { closeVou(); return; }

    /* PILIH VOUCHER */
    el = e.target.closest("[data-vou]");
    if (el) { selVou(parseInt(el.dataset.vou, 10)); return; }

    /* PESAN SEKARANG — FIX #7, cek disabled */
    if (e.target.closest("#btn-order")) { goToConfirm(); return; }

    /* EDIT PESANAN */
    if (e.target.closest("[data-act='edit-order']")) { backToCheckout(); return; }

    /* CONFIRM ORDER — FIX #1, aman dari spam */
    if (e.target.closest("[data-act='do-co']")) { goToInvoice(); return; }

    /* WHATSAPP — FIX #8, validasi + FIX #6 APK */
    if (e.target.closest("#btn-wa")) { sendWA(); return; }

    /* CLOSE INVOICE */
    if (e.target.closest("[data-act='close-inv']")) {
        d.pginv.classList.add('hidden');
        unlock();
        currentPage = 'home';
        navTo('history');
        return;
    }

    /* INVOICE HOME */
    if (e.target.closest("[data-act='inv-home']")) { goToHome(); return; }

    /* SEARCH */
    if (e.target.closest("[data-act='search']")) { openSearch(); return; }

    /* CLOSE SEARCH */
    if (e.target.closest("[data-act='close-search']")) { closeSearch(); return; }

    /* GO SHOP */
    if (e.target.closest("[data-act='go-shop']")) { navTo('home'); return; }

    /* ORDER DETAIL */
    el = e.target.closest("[data-odet]");
    if (el) { viewDetail(el.dataset.odet); return; }

    /* DIM OVERLAY */
    if (e.target.closest("#dim")) {
        if (currentPage === 'cart') closeCart();
        return;
    }

});

})();
