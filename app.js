const services=[
  {id:"cukur-a",name:"Cukur A",price:30000},
  {id:"cukur-b",name:"Cukur B",price:35000},
  {id:"semir-a",name:"Semir A",price:50000},
  {id:"semir-b",name:"Semir B",price:100000},
  {id:"semir-c",name:"Semir C",price:150000},
  {id:"semir-d",name:"Semir D",price:200000}
];
let selectedService=services[0];
let payment="Cash";
let transactions=JSON.parse(localStorage.getItem("ruangCukurTransactions")||"[]");

const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
const servicesEl=document.querySelector("#services");

services.forEach((s,i)=>{
  const btn=document.createElement("button");
  btn.className="service"+(i===0?" selected":"");
  btn.innerHTML=`<b>${s.name}</b><small>${rupiah(s.price)}</small>`;
  btn.onclick=()=>{
    selectedService=s;
    document.querySelectorAll(".service").forEach(x=>x.classList.remove("selected"));
    btn.classList.add("selected");
  };
  servicesEl.appendChild(btn);
});

document.querySelectorAll(".pay").forEach(btn=>btn.onclick=()=>{
  payment=btn.dataset.pay;
  document.querySelectorAll(".pay").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
});

function render(){
  const omzet=transactions.reduce((a,t)=>a+t.price,0);
  const barberTotal=transactions.reduce((a,t)=>a+t.barberShare,0);
  const ownerTotal=transactions.reduce((a,t)=>a+t.ownerShare,0);
  document.querySelector("#omzet").textContent=rupiah(omzet);
  document.querySelector("#jumlah").textContent=transactions.length;
  document.querySelector("#barberTotal").textContent=rupiah(barberTotal);
  document.querySelector("#ownerTotal").textContent=rupiah(ownerTotal);
  const h=document.querySelector("#history");
  if(!transactions.length){h.innerHTML='<p class="empty">Belum ada transaksi.</p>';return}
  h.innerHTML=transactions.slice().reverse().map(t=>`
    <div class="history-item">
      <div><strong>${t.service}</strong><small>${t.barber} · ${t.payment}</small></div>
      <div class="amount"><b>${rupiah(t.price)}</b><small>Barber ${rupiah(t.barberShare)}</small></div>
    </div>`).join("");
}
document.querySelector("#save").onclick=()=>{
  const barber=document.querySelector("#barber").value.trim();
  if(!barber){alert("Isi nama barber terlebih dahulu.");return}
  const price=selectedService.price;
  transactions.push({
    id:Date.now(),date:new Date().toISOString(),barber,service:selectedService.name,
    price,barberShare:price/2,ownerShare:price/2,payment
  });
  localStorage.setItem("ruangCukurTransactions",JSON.stringify(transactions));
  document.querySelector("#barber").value="";
  render();
};
document.querySelector("#clear").onclick=()=>{
  if(confirm("Hapus semua transaksi demo di perangkat ini?")){
    transactions=[];localStorage.removeItem("ruangCukurTransactions");render();
  }
};
render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
