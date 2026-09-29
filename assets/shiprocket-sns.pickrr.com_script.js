(()=>{var Pe="https://reporting.pickrr.com/api/ve1/dashboard-service/subscription/plan",he=async(e,t)=>{try{let s=localStorage.getItem("userManagementToken"),o=await(await fetch(Pe,{method:"POST",headers:{"Content-Type":"application/json","x-user-token":s},body:JSON.stringify({filterKey:"product",filterValue:{productId:e.toString(),sellerDomain:t}})})).json();return o?.status&&o?.data?.planData?o.data:null}catch{return null}};var Y=()=>window.ShopifyAnalytics?.meta?.product?.id,ee=()=>window.ShopifyAnalytics?.meta?.product?.handle,G=()=>document.getElementById("sellerDomain")?.value??window.Shopify?.shop,Ae=()=>{let t=document.querySelector(".sr-sns-shadow-host")?.closest("form");return t?.getAttribute("action")?.includes("/cart/add")?t:null},L=()=>{let e=Ae(),t=e?new FormData(e).get("id"):null;if(t)return t;let s=(window.ShopifyAnalytics?.meta?.product?.variants||[]).map(o=>String(o?.id));return Array.from(document.querySelectorAll("[name='id']")).map(o=>o?.value).find(o=>o&&(!s.length||s.includes(String(o))))||window.ShopifyAnalytics?.meta?.selectedVariantId||window.ShopifyAnalytics?.meta?.product?.variants?.[0]?.id},te=()=>window.ShopifyAnalytics?.meta?.product,oe=()=>{try{let t=document.querySelector(".sr-subscribe-btn").closest("form"),s=t.getAttribute("action")||"",r=new FormData(t),o=parseInt(r.get("quantity"),10);return o&&o>0?o:1}catch{return 1}},se=(e,t=40)=>e.length>t?e.slice(0,t)+"...":e,R=({isFromModal:e=!1})=>{let t=window.shiprocketSnsConfig||{};return{injectContainer:re(),marginTop:t?.marginTop||0,marginBottom:t?.marginBottom||0,buttonText:t?.buttonText,buttonTextColor:t?.buttonTextColor||(e?"#ffffff":"#0A0A0A"),buttonBorderColor:t?.buttonBorderColor||"#0000001A",buttonBgColor:t?.buttonBgColor||(e?"#3476E6":"#FFFFFF"),buttonWidth:t?.buttonWidth,proceedButtonBgColor:t?.proceedButtonBgColor||t?.buttonBgColor||(e?"#3476E6":"#FFFFFF"),proceedButtonBorderColor:t?.proceedButtonBorderColor,proceedButtonTextColor:t?.proceedButtonTextColor||t?.buttonTextColor||(e?"#ffffff":"#0A0A0A"),addToCartButtonVisible:t?.addToCartButtonVisible!==!1,addToCartButtonBgColor:t?.addToCartButtonBgColor||"#FFFFFF",addToCartButtonBorderColor:t?.addToCartButtonBorderColor||"#3476E6",addToCartButtonTextColor:t?.addToCartButtonTextColor||"#3476E6"}},re=()=>{let e=window.shiprocketSnsConfig||{};if(e.injectSelector){let o=document.querySelector(e.injectSelector);if(o)return o}if(e.injectClassName){let o=e.injectClassName.replace(".",""),n=document.querySelector(`.${o}`);if(n)return n}let t=document.querySelector(".shiprocket-headless[data-type='product']");if(t)return t;let s=document.querySelector('form[action*="/cart/add"]')||document.querySelector("product-form form");if(s)return s;let r=document.querySelector('[name="add"]')||document.querySelector('button[type="submit"]');return r?.parentElement?r.parentElement:null},$e=async(e,t,s=null,r=null,o=null,n=null)=>{try{let i={method:t,headers:{"Content-Type":"application/json",...n&&{...n}},...o&&{body:JSON.stringify(o)}},p=await fetch(e,i);if(!p.ok){typeof r=="function"&&r(p.status);return}let c=await p.json();typeof s=="function"&&s(c);let w={};return p?.headers?.forEach((f,E)=>{w[E]=f}),{body:c,headers:w}}catch(i){typeof r=="function"&&r(i.message)}},V=e=>{try{$e("https://events.pickrr.com/collect","POST",null,function(t){},{etype:e?.name,ppath:e?.ppath?e?.ppath:"",usid:e?.usid?e?.usid:"",uuid:e?.uuid?e?.uuid:"",et:new Date().toISOString(),ptype:e?.category?e?.category:"",data:{env:"PROD",payload:JSON.stringify({...e?.payload&&e?.payload,site:window.location.host}),...e?.additionalData||{}}})}catch{}};var ge=async({variantId:e,quantity:t=1,properties:s={}})=>{if(!e)return{ok:!1,error:"Missing variantId"};let r=Number(t),o={items:[{id:Number(e)||e,quantity:r>0?r:1,...Object.keys(s).length&&{properties:s}}]};try{let n=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(o)});if(!n.ok){let i="";try{i=(await n.json())?.description||""}catch{}return{ok:!1,status:n.status,error:i}}return{ok:!0,cart:await n.json()}}catch(n){return{ok:!1,error:n?.message}}};var fe="https://fastrr-boost-ui.pickrr.com";function Be(){if(document.getElementById("sr-sns-checkout-css"))return;let e=document.createElement("link");e.id="sr-sns-checkout-css",e.rel="stylesheet",e.href=`${fe}/assets/styles/shopify.css`,document.head.appendChild(e)}function Fe(){return new Promise((e,t)=>{if(document.getElementById("sr-sns-checkout-js")){if(window.shiprocketCheckoutEvents?.buyDirect)return e();let r=document.getElementById("sr-sns-checkout-js");r.addEventListener("load",e),r.addEventListener("error",t);return}let s=document.createElement("script");s.id="sr-sns-checkout-js",s.src=`${fe}/assets/js/channels/shopify.js`,s.async=!0,s.onload=()=>e(),s.onerror=()=>t(new Error("Checkout JS failed to load")),document.head.appendChild(s)})}async function Ee(){Be(),await Fe()}var ye=async({variantId:e,quantity:t=1,customAttributes:s={},buttonEl:r=null})=>{try{if(r&&(r.disabled=!0),await Ee(),!window.shiprocketCheckoutEvents?.buyDirect)throw new Error("Checkout handler not available");let o=await fetch(window.location.pathname+".js");if(!o.ok)throw new Error("Product fetch failed: "+o.status);let n=await o.json(),i=n.variants.find(c=>String(c.id)===String(e));if(!i)throw new Error("Variant not found: "+e);if(!n.available||!i.available)return;let p={productId:n.id,title:i.name?i.name:n.title,variantId:i.id,variantTitle:i.public_title?i.title:"",price:parseFloat((i.price/100).toFixed(2)),quantity:isNaN(Number(t))||Number(t)===0?1:Number(t),image:i.featured_image?i.featured_image.src:n.media?.[0]?.src??"",item_meta_data:{properties:{}},customAttributes:{...i.properties,...s},vendor:n.vendor,product_type:n.type};window.shiprocketCheckoutEvents?.buyDirect({type:"product",products:[p],cartAttributes})}catch{let n=`https://${window.location.host}/cart/${e}:${t}`;window.location.href=n}finally{r&&(r.disabled=!1)}};var ve=(e,t)=>{let s={...e,startDate:t?.startDate||"",endDate:t?.endDate||"",failSafeCod:t?.failSafeCod??!1,subscriptionPlanName:t?.subscriptionPlanName||""};return btoa(JSON.stringify(s))},ne=(e,t,s,r)=>{if(!e){alert("Select variant");return}let{prepaidPlanDetails:o,...n}=t||{},p=t?.planType==="PREPAID"?t:n,c=t?.prepaidPlanDetails?.deliveries||oe(),w={fastrrSbo:ve(p,s)};window.shiprocketCheckoutDirectHandler?window.shiprocketCheckoutDirectHandler({type:"product",products:[{productId:Y(),variantId:e,quantity:c,customAttributes:w}]}):ye({variantId:e,quantity:c,customAttributes:w,buttonEl:r})},ie=async(e,t,s)=>e?ge({variantId:e,quantity:oe(),properties:{_fastrrSbo:ve(t,s)}}):(alert("Select variant"),{ok:!1,error:"Missing variantId"});var J=`<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_3452_7596)">
            <path d="M7.5 13.75C10.9518 13.75 13.75 10.9518 13.75 7.5C13.75 4.04822 10.9518 1.25 7.5 1.25C4.04822 1.25 1.25 4.04822 1.25 7.5C1.25 10.9518 4.04822 13.75 7.5 13.75Z" stroke="#272727" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.5 10V7.5" stroke="#272727" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7.5 5H7.50583" stroke="#272727" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <defs>
            <clipPath id="clip0_3452_7596">
                <rect width="15" height="15" fill="white" />
            </clipPath>
        </defs>
    </svg>`,ae=`<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6.25L6 18.75" stroke="#0A0A0A" stroke-width="1.33319" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6.25L18 18.75" stroke="#0A0A0A" stroke-width="1.33319" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,le=`<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6.25L6 18.75" stroke="#fff" stroke-width="1.33319" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6.25L18 18.75" stroke="#fff" stroke-width="1.33319" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,xe=`<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#272727" stroke-width="1.33319" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,we=`<svg width="24" height="29" viewBox="0 0 24 29" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 2.09534C0 0.938117 0.938118 0 2.09534 0H4.36364V2.09534H0Z" fill="#025000"/>
<path d="M2.18164 0H18.9998C21.7612 0 23.9998 2.23858 23.9998 5V26.9431C23.9998 27.7042 23.1835 28.1863 22.517 27.8189L14.3477 23.315C14.0472 23.1493 13.6827 23.1493 13.3821 23.315L5.21284 27.8189C4.54636 28.1863 3.73003 27.7042 3.73003 26.9431V14.3182V2.39708C3.73003 1.36313 3.12413 0.425141 2.18164 0Z" fill="#17A34A"/>
</svg>`;var z=`*, *::before, *::after {
  box-sizing: border-box;
}

.sr-subscribe-btn {
  width: 100%;
  border: 1px solid #0000001A;
  background-color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  color: #0A0A0A;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
}
.sr-subscribe-modal-overlay {
  font-family: Inter, Arial, Helvetica, sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* max safe z-index - the shadow host itself doesn't create a stacking
     context, so this has to outrank every other widget on the host page
     (chatbots, cookie banners, etc.) directly */
  z-index: 2147483647;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sr-subscribe-modal-w-100 {
  width: 100%;
}

.sr-subscribe-modal-container {
  width: 50%;
  max-width: 500px;
  border: 0.56px solid #0000001A;
  border-radius: 10px;
  padding: 15px;
  background-color: #fff;
  position: relative;
}

/* Everything except the close button lives in here, so the button (which is
   floated above the sheet on mobile via a negative offset) never gets
   clipped by this wrapper's own scrollbar when content is taller than it */
.sr-subscribe-modal-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.sr-subscribe-modal-header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sr-subscribe-modal-header {
  font-size: 16px;
  font-weight: 600;
  color:#0A0A0A;
  white-space: nowrap;
  overflow: hidden;   
  text-overflow: ellipsis;
}

.sr-subscribe-modal-header-price {
  padding-right: 12px;
  text-align: right;
}

.sr-subscribe-modal-perPieceLabel {
  color: #807B7B;
  font-size: 11px;
  font-weight: 400;
}

.sr-subscribe-modal-subheader {
  color: #717182;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;   
  text-overflow: ellipsis;
}

.sr-subscribe-modal-close {
  position: absolute;
  top:5px;
  right: 5px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
}

.sr-subscribe-modal-inputHeader {
  color:#0A0A0A;
  font-size: 12px;
  font-weight: 500;
  margin-top: 10px;
}

.sr-subscribe-modal-inputSubHeader {
  color: #0A0A0A;
  font-size: 10px;
  font-weight: 500;
  margin-top: 2px;
}

.sr-subscribe-modal-select {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #D3D3D3;
  padding: 10px;
  color: #0A0A0A;
  font-size: 12px;
  font-weight: 400;
  box-shadow: none;
  white-space: nowrap;
  overflow: hidden;   
  text-overflow: ellipsis;
  outline: none;
}

.sr-subscribe-modal-option {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;   
  text-overflow: ellipsis;
}

.sr-subscribe-modal-proceed {
  background-color: var(--sns-proceedbtn-bg-color);
  border-radius: 8px;
  padding: 8px 12px;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color:var(--sns-proceedbtn-txt-color);
  font-size: 14px;
  font-weight: 500;
  border: var(--sns-proceedbtn-border);
  cursor: pointer;
}

.sr-subscribe-modal-ctaGroup {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sr-subscribe-modal-addToCart {
  background-color: var(--sns-addtocartbtn-bg-color);
  border: 1px solid var(--sns-addtocartbtn-border-color);
  border-radius: 8px;
  padding: 8px 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sns-addtocartbtn-txt-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sr-subscribe-modal-proceed:disabled,
.sr-subscribe-modal-addToCart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sr-subscribe-modal-planList {
  max-height: 300px;
  overflow-y: auto;
  padding-top: 12px;
}
/* Ribbon badge hanging from a delivery box's top-right corner - the shape is
   the provided SVG, with the discount text absolutely positioned over it */
.sr-subscribe-modal-ribbon {
  position: absolute;
  top: -2px;
  right: 6px;
  height: 34px;
  /* width is set inline per-badge based on the discount label's length */
  line-height: 0;
}

.sr-subscribe-modal-ribbon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.sr-subscribe-modal-ribbonText {
  position: absolute;
  top: 6px;
  /* the SVG's folded corner eats into the left ~17% of its width, so
     center the text within the remaining flag area, not the full box */
  left: 17%;
  width: 83%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 6.5px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  pointer-events: none;
}

/* Delivery Frequency pills */
.sr-subscribe-modal-frequencyList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.sr-subscribe-modal-frequencyOption {
  border: 0.56px solid #0000001A;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0A0A0A;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
}

.sr-subscribe-modal-frequencyOption > input[type="radio"] {
  accent-color: var(--sns-buttonbg-color);
}

.sr-subscribe-modal-frequencyOption-active {
  border-color: var(--sns-buttonbg-color);
}

/* Recurring / Prepaid segmented toggle */
.sr-subscribe-modal-planTypeToggle {
  display: flex;
  background-color: #F0F0F0;
  border-radius: 8px;
  padding: 3px;
  margin-top: 8px;
  gap: 4px;
}

.sr-subscribe-modal-planTypeToggle-single {
  /* no prepaid plan for this frequency - keep the same width the track
     would have with two pills instead of stretching across the whole row */
  width: 50%;
}

.sr-subscribe-modal-planTypeOption {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #0A0A0A;
  cursor: pointer;
  text-align: center;
}

.sr-subscribe-modal-planTypeOption-active {
  background-color: #FFFFFF;
  box-shadow: 0 1px 2px #0000001A;
}

.sr-subscribe-modal-planTypeOption-disabled {
  cursor: default;
  color: #807B7B;
}

/* Hover/focus tooltip on the (i) icons */
.sr-subscribe-modal-tooltipWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.sr-subscribe-modal-tooltip {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  width: 170px;
  white-space: normal;
  background-color: #272727;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
  padding: 6px 10px;
  border-radius: 6px;
  transition: opacity 0.15s ease;
  z-index: 1;
  pointer-events: none;
}

.sr-subscribe-modal-tooltipWrap:hover .sr-subscribe-modal-tooltip {
  visibility: visible;
  opacity: 1;
}

/* No. of deliveries pills (prepaid only) - a fixed size per pill, wrapping
   to the next line when a row runs out of room, rather than stretching to
   fill the available width */
.sr-subscribe-modal-deliveriesList {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.sr-subscribe-modal-deliveryOption {
  position: relative;
  flex: 0 0 auto;
  width: 100px;
  height: 54px;
  border: 0.56px solid #0000001A;
  border-radius: 10px;
  /* reserve room on the right so the ribbon never overlaps the delivery count */
  padding: 8px 26px 8px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #0A0A0A;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.sr-subscribe-modal-deliveryOption > input[type="radio"] {
  accent-color: var(--sns-buttonbg-color);
}

.sr-subscribe-modal-deliveryOption-active {
  border-color: var(--sns-buttonbg-color);
}

/* "Why the Prepaid Plan Saves You More" collapsible comparison */
.sr-subscribe-modal-savingsSection {
  width: 100%;
  background-color: #FFF8EC;
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 12px;
}

.sr-subscribe-modal-savingsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0A0A0A;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.sr-subscribe-modal-chevron {
  display: flex;
  transition: transform 0.15s ease;
}

.sr-subscribe-modal-chevron-up {
  transform: rotate(180deg);
}

.sr-subscribe-modal-savingsBody {
  margin-top: 10px;
}

.sr-subscribe-modal-savingsRow {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr 1fr;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  font-size: 11px;
  color: #0A0A0A;
}

.sr-subscribe-modal-savingsRowHeader {
  color: #807B7B;
  font-weight: 500;
}

.sr-subscribe-modal-savingsRow-highlight {
  border: 1.5px solid var(--sns-buttonbg-color);
  border-radius: 8px;
  padding: 6px 8px;
  font-weight: 600;
}

.sr-subscribe-modal-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.sr-subscribe-modal-dot-grey {
  background-color: #807B7B;
}

.sr-subscribe-modal-dot-green {
  background-color: #00A63E;
}

.sr-subscribe-modal-savingsBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: #DCFCE7;
  color: #008236;
  border-radius: 8px;
  padding: 8px 10px;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 500;
}

/* Footer: amount-to-pay summary and the checkout button share one row.
   Sticky to the bottom of the scrollable body so it stays visible even
   when the plan list pushes content taller than the modal. */
.sr-subscribe-modal-footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  position: sticky;
  bottom: 0;
  background-color: #fff;
  border-top: 0.56px solid #0000001A;
  padding-top: 10px;
  padding-bottom: 2px;
  z-index: 1;
}

.sr-subscribe-modal-footer-amount {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sr-subscribe-modal-footer-label {
  color: #717182;
  font-size: 12px;
  font-weight: 400;
}

.sr-subscribe-modal-footer-price {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.sr-subscribe-modal-saveBadge {
  background: linear-gradient(90deg, #098308 0%, #5CBB49 100%);
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 500;
  padding: 4px 8px;
  white-space: nowrap;
}

.sr-subscribe-modal-prevPrice {
  color:#807B7B;
  font-size: 14px;
  font-weight: 400;
  text-decoration: line-through;
  margin-right: 5px;
}

.sr-subscribe-modal-newPrice {
  color:#0A0A0A;
  font-size: 14px;
  font-weight: 700;
}

.sr-subscribe-modal-helperContainer {
  background-color: #F7F7F7;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
}

.sr-subscribe-modal-helperHeader {
  color:#272727;
  font-size: 12px;
  font-weight: 600;
}

.sr-subscribe-modal-helperSubtext {
  color:#272727;
  font-size: 12px;
  font-weight: 400;
}

.sr-subscribe-modal-plans {
  width: 100%;
}

@media (max-width: 768px) {

  .sr-subscribe-modal-close {
    position: absolute;
    z-index: 10000;
  }

  .sr-subscribe-modal-container {
    width: 95%;
    max-width: 95%;
    border-radius: 16px 16px 0 0;
    padding: 16px;
    animation: sr-slide-up 0.3s ease-out;
  }

  .sr-subscribe-modal-overlay {
    align-items: flex-end !important;
  }

  .sr-subscribe-modal-planOption {
    gap:10px;
  }

  @keyframes sr-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .sr-subscribe-modal-close {
    top: -40px;
    right: 50%;
    transform: translateX(50%);
    background: #000;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sr-subscribe-modal-body {
    max-height: 75vh;
  }

  .sr-subscribe-modal-savingsRow {
    grid-template-columns: 1.2fr 0.9fr 0.9fr 0.9fr;
    font-size: 10px;
  }

  .sr-subscribe-modal-tooltip {
    width: 140px;
  }
}

/* ============================================================
   Legacy modal - rendered when no variant of the product has a
   prepaid plan. Restores the pre-prepaid ("release") layout;
   every rule is scoped to .sr-subscribe-modal-legacy so it never
   touches the prepaid-capable modal above.
   ============================================================ */
.sr-subscribe-modal-container.sr-subscribe-modal-legacy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-inputHeader {
  margin-top: 0;
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-planOption {
  border: 0.56px solid #0000001A;
  width: 100%;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0A0A0A;
  font-size: 12px;
  font-weight: 400;
  margin-bottom: 10px;
  cursor: pointer;
  position: relative;
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-planOption-mostpopular {
  position: absolute;
  right: 10px;
  top: -10px;
  font-size: 9px;
  font-weight: 500;
  color: #FFFFFF;
  padding: 2px 8px;
  border-radius: 8px;
  background-color: #00A63E;
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-planOptionData {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-planOptionData > input[type="radio"] {
  accent-color: var(--sns-buttonbg-color);
}

.sr-subscribe-modal-legacy .sr-subscribe-modal-planSave {
  background-color: #DCFCE7;
  border-radius: 8px;
  color: #008236;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
}

/* release kept both CTAs full-width */
.sr-subscribe-modal-legacy .sr-subscribe-modal-ctaGroup,
.sr-subscribe-modal-legacy .sr-subscribe-modal-proceed,
.sr-subscribe-modal-legacy .sr-subscribe-modal-addToCart {
  width: 100%;
}
`;var Ce=e=>{if(!Object.values(e?.planData||{}).some(d=>(d||[]).some(g=>g?.prepaidPlanDetails?.length)))return je(e);let s=document.querySelector(".sr-sns-modal-shadow-host");s&&s.remove();let r=L(),o=null,n=null,i=null,p=!0,c=ee(),w=()=>{let d=!!o?.prepaidPlanDetails?.length&&n==="prepaid"&&i,{prepaidPlanDetails:g,...B}=o||{};return d?{...B,planType:"PREPAID",prepaidPlanDetails:i}:{...B,planType:"RECURRING"}},f=te(),E=f?.variants||[],T=(window.innerWidth??0)<768,x=Object.keys(e?.planData||{}),_=x?.length?x.filter(d=>e?.planData?.[d]?.length):[],b=f?.variants?.filter(d=>_.includes((d?.id||"").toString()))||[],h=document.createElement("div");h.className="sr-sns-modal-shadow-host",h.setAttribute("style","display:block !important");let C=h.attachShadow({mode:"open"}),N=document.createElement("style");N.textContent=z,C.appendChild(N);let y=document.createElement("div");y.className="sr-subscribe-modal-overlay";let S=R({isFromModal:!0});y.style.setProperty("--sns-buttonbg-color",S?.buttonBgColor),y.style.setProperty("--sns-buttontxt-color",S?.buttonTextColor),y.style.setProperty("--sns-buttonborder-color",S?.buttonBorderColor),y.style.setProperty("--sns-proceedbtn-bg-color",S?.proceedButtonBgColor),y.style.setProperty("--sns-proceedbtn-border",S?.proceedButtonBorderColor?`1px solid ${S.proceedButtonBorderColor}`:"none"),y.style.setProperty("--sns-proceedbtn-txt-color",S?.proceedButtonTextColor),y.style.setProperty("--sns-addtocartbtn-bg-color",S?.addToCartButtonBgColor),y.style.setProperty("--sns-addtocartbtn-border-color",S?.addToCartButtonBorderColor),y.style.setProperty("--sns-addtocartbtn-txt-color",S?.addToCartButtonTextColor),y.innerHTML=`
    <div class="sr-subscribe-modal-container">
      <span class="sr-subscribe-modal-close">${T?le:ae}</span>
      <div class="sr-subscribe-modal-body">
        <div class="sr-subscribe-modal-w-100">
          <div class="sr-subscribe-modal-header-container">
            <div class="sr-subscribe-modal-header" title="${e?.subscriptionPlanName}">${e?.subscriptionPlanName??"Subscription Plan"}</div>
            <div class="sr-subscribe-modal-header-price"></div>
          </div>
          <div class="sr-subscribe-modal-subheader">Choose how often you'd like to receive ${c??"product"}</div>
        </div>

        <div class="sr-subscribe-modal-variant sr-subscribe-modal-w-100"></div>
        <div class="sr-subscribe-modal-plans"></div>

        <div class="sr-subscribe-modal-helperContainer">
          <div class="sr-subscribe-modal-infoIcon">${J}</div>
          <div>
            <div class="sr-subscribe-modal-helperHeader">
              Subscription items must be purchased separately.
            </div>
            <div class="sr-subscribe-modal-helperSubtext">
              You can pause or cancel your subscription anytime by reaching out to the seller on ${e?.sellerEmail??""}
            </div>
          </div>
        </div>

        <div class="sr-subscribe-modal-footer">
          <div class="sr-subscribe-modal-footer-amount"></div>
          <div class="sr-subscribe-modal-ctaGroup">
            <button class="sr-subscribe-modal-addToCart">
              Add to Cart
            </button>
            <button class="sr-subscribe-modal-proceed">
              Proceed to Checkout
            </button>
          </div>
      </div>
      </div>
    </div>
  `,C.appendChild(y),document.body.appendChild(h),C.querySelector(".sr-subscribe-modal-close").onclick=()=>h.remove(),y.onclick=d=>{d.target===y&&h.remove()};let W=C.querySelector(".sr-subscribe-modal-variant"),A=C.querySelector(".sr-subscribe-modal-plans"),H=C.querySelector(".sr-subscribe-modal-header-price"),l=C.querySelector(".sr-subscribe-modal-footer-amount"),m=C.querySelector(".sr-subscribe-modal-addToCart");W.innerHTML=`
    <div class="sr-subscribe-modal-inputHeader">Select Variant</div>
    ${b?.length>1?`<select class="sr-subscribe-modal-select">
          ${b.map(d=>`
              <option class="sr-subscribe-modal-option" value="${d.id}"
                ${d.id==r?"selected":""}>
                ${se(d.name,40)}
              </option>`).join("")}
         </select>`:`<div class="sr-subscribe-modal-select" title="${b?.[0]?.name}">
           ${b?.[0]?.name??""}
         </div>`}
  `;let F=d=>`<span class="sr-subscribe-modal-tooltipWrap">${J}<span class="sr-subscribe-modal-tooltip">${d}</span></span>`,$=()=>{let d=b?.length&&b?.filter(a=>a?.id?.toString()===(r??"").toString())?.length?r:b?.[0]?.id,g=e?.planData[d]||[],B=E?.filter(a=>a?.id==d)?.[0]||{};if(!g.length){H.innerHTML="",A.innerHTML="<p>No plans available</p>",l.innerHTML="";return}let u=g.some(a=>a?.popular);g.includes(o)||(o=(u?g.find(a=>a?.popular):g[0])||g[0]);let k=o?.prepaidPlanDetails||[],v=!!k.length;v?n||(n="prepaid"):n="recurring",k.includes(i)||(i=k.find(a=>a?.bestValue)||k[0]||null);let D=v&&n==="prepaid"&&!!i;m.style.display=S?.addToCartButtonVisible&&!D?"":"none";let P=(B?.price||0)/100,q=o?.discountType==="FLAT"?Math.max(0,P-(o?.discountAmount??0)):Math.max(0,P*(1-(o?.discountAmount??0)/100)),O=i?.deliveries??0,K=q*O,Q=P*O,U=v&&i?i?.discountType?.toUpperCase()==="FLAT"?Math.max(0,Q-(i?.discountValue??0)):Math.max(0,Q*(1-(i?.discountValue??0)/100)):K,Z=O?U/O:q,ce=D?Z:q,de=ce>=P;H.innerHTML=`
      ${de?"":`<span class="sr-subscribe-modal-prevPrice">\u20B9${P}</span>`}
      <span class="sr-subscribe-modal-newPrice">\u20B9${de?P:ce.toFixed(2)}</span>
      <div class="sr-subscribe-modal-perPieceLabel">per piece</div>
    `;let I=D?Q:P,X=D?U:q,pe=X<I,ue=pe&&I?Math.round((I-X)/I*100):0;A.innerHTML=`
      <div class="sr-subscribe-modal-inputHeader">Delivery Frequency</div>
      <div class="sr-subscribe-modal-frequencyList">${g.map((a,j)=>`
              <div class="sr-subscribe-modal-frequencyOption ${a===o?"sr-subscribe-modal-frequencyOption-active":""}" data-index="${j}">
                <input type="radio" name="frequency" ${a===o?"checked":""} />
                Every ${a?.intervalFrequency??""} ${(a?.interval??"").toLowerCase()}
              </div>
            `).join("")}</div>

      <div class="sr-subscribe-modal-inputHeader">Subscription Plan</div>
      ${v?'<div class="sr-subscribe-modal-inputSubHeader">Select subscription plan</div>':""}
      <div class="sr-subscribe-modal-planTypeToggle ${v?"":"sr-subscribe-modal-planTypeToggle-single"}">
        <div class="sr-subscribe-modal-planTypeOption ${v?n==="recurring"?"sr-subscribe-modal-planTypeOption-active":"":"sr-subscribe-modal-planTypeOption-disabled"}" ${v?'data-type="recurring"':""}>
          Recurring Plan ${F("You're charged automatically on every delivery cycle.")}
        </div>
        ${v?`
          <div class="sr-subscribe-modal-planTypeOption ${n==="prepaid"?"sr-subscribe-modal-planTypeOption-active":""}" data-type="prepaid">
            Prepaid Plan ${F("Pay upfront for all deliveries in one go and save more.")}
          </div>
        `:""}
      </div>

      ${D?`
        <div class="sr-subscribe-modal-inputHeader">No. of deliveries</div>
        <div class="sr-subscribe-modal-deliveriesList">${k.map((a,j)=>{let me=`${a?.discountType?.toUpperCase()==="FLAT"?"\u20B9":""}${a?.discountValue}${a?.discountType?.toUpperCase()==="FLAT"?"":"%"}`,ke=Math.min(46,Math.max(22,me.length*6+6));return`
                <div class="sr-subscribe-modal-deliveryOption ${a===i?"sr-subscribe-modal-deliveryOption-active":""}" data-index="${j}">
                  ${a?.discountValue?`
                    <div class="sr-subscribe-modal-ribbon" style="width:${ke}px;">
                      ${we}
                      <div class="sr-subscribe-modal-ribbonText">
                        <span>${me}</span>
                        <span>OFF</span>
                      </div>
                    </div>
                  `:""}
                  <input type="radio" name="deliveries" ${a===i?"checked":""} />
                  ${a?.deliveries??""}
                </div>
              `}).join("")}</div>
      `:""}

      ${v?`
        <div class="sr-subscribe-modal-savingsSection">
          <div class="sr-subscribe-modal-savingsHeader">
            <span>\u{1F4A1} Why the Prepaid Plan Saves You More</span>
            <span class="sr-subscribe-modal-chevron ${p?"sr-subscribe-modal-chevron-up":""}">${xe}</span>
          </div>
          ${p?`
            <div class="sr-subscribe-modal-savingsBody">
              <div class="sr-subscribe-modal-savingsRow sr-subscribe-modal-savingsRowHeader">
                <span>Plan</span><span>Per piece</span><span>No. of deliveries</span><span>Total</span>
              </div>
              <div class="sr-subscribe-modal-savingsRow">
                <span><span class="sr-subscribe-modal-dot sr-subscribe-modal-dot-grey"></span>Recurring</span>
                <span>\u20B9${q.toFixed(2)} / pc</span>
                <span>${O}</span>
                <span>\u20B9${K.toFixed(2)}</span>
              </div>
              <div class="sr-subscribe-modal-savingsRow sr-subscribe-modal-savingsRow-highlight">
                <span><span class="sr-subscribe-modal-dot sr-subscribe-modal-dot-green"></span>Prepaid</span>
                <span>\u20B9${Z.toFixed(2)} / pc</span>
                <span>${O}</span>
                <span>\u20B9${U.toFixed(2)}</span>
              </div>
            </div>
            <div class="sr-subscribe-modal-savingsBanner">
              <span>\u{1F389} You save \u20B9${Math.max(0,q-Z).toFixed(2)} per piece with Prepaid</span>
              <span>\u20B9${Math.max(0,K-U).toFixed(2)} total</span>
            </div>
          `:""}
        </div>
      `:""}
    `,l.innerHTML=`
      <span class="sr-subscribe-modal-footer-label">Amount to pay</span>
      <div class="sr-subscribe-modal-footer-price">
        ${pe?`<span class="sr-subscribe-modal-prevPrice">\u20B9${I.toFixed(2)}</span>`:""}
        <span class="sr-subscribe-modal-newPrice">\u20B9${X.toFixed(2)}</span>
        ${ue?`<span class="sr-subscribe-modal-saveBadge">Save ${ue}%</span>`:""}
      </div>
    `,A.querySelectorAll(".sr-subscribe-modal-frequencyOption").forEach(a=>{a.onclick=()=>{let j=Number(a.dataset.index);o=g[j],n=null,i=null,p=!0,$()}}),A.querySelectorAll(".sr-subscribe-modal-planTypeOption[data-type]").forEach(a=>{a.onclick=()=>{n=a.dataset.type,p=!0,$()}}),A.querySelectorAll(".sr-subscribe-modal-deliveryOption").forEach(a=>{a.onclick=()=>{let j=Number(a.dataset.index);i=k[j],p=!0,$()}});let be=A.querySelector(".sr-subscribe-modal-savingsHeader");be&&(be.onclick=()=>{p=!p,$()})};$();let M=C.querySelector(".sr-subscribe-modal-select");M&&(M.onchange=d=>{r=d.target.value,o=null,n=null,i=null,p=!0,$()}),C.querySelector(".sr-subscribe-modal-proceed").onclick=d=>{if(!o){alert("Please select a plan");return}ne(r,w(),e,d.currentTarget)},C.querySelector(".sr-subscribe-modal-addToCart").onclick=async d=>{if(!o){alert("Please select a plan");return}let g=d.currentTarget;g.disabled=!0,V({name:"S&S add to cart clicked",payload:{variant:r}});let B=await ie(r,w(),e);if(!B?.ok){g.disabled=!1,alert(B?.error||"Could not add this item to your cart");return}h.remove(),window.location.href="/cart"}},je=e=>{let t=document.querySelector(".sr-sns-modal-shadow-host");t&&t.remove();let s=L(),r=null,o=ee(),n=te(),i=n?.variants||[],p=(window.innerWidth??0)<768,c=Object.keys(e?.planData||{}),w=c?.length?c.filter(l=>e?.planData?.[l]?.length):[],f=n?.variants?.filter(l=>w.includes((l?.id||"").toString()))||[],E=(l=[])=>l.length?l.every(m=>m?.discountAmount===l[0]?.discountAmount&&m?.discountType===l[0]?.discountType):!1,T=document.createElement("div");T.className="sr-sns-modal-shadow-host",T.setAttribute("style","display:block !important");let x=T.attachShadow({mode:"open"}),_=document.createElement("style");_.textContent=z,x.appendChild(_);let b=document.createElement("div");b.className="sr-subscribe-modal-overlay";let h=R({isFromModal:!0});b.style.setProperty("--sns-buttonbg-color",h?.buttonBgColor),b.style.setProperty("--sns-buttontxt-color",h?.buttonTextColor),b.style.setProperty("--sns-buttonborder-color",h?.buttonBorderColor),b.style.setProperty("--sns-proceedbtn-bg-color",h?.proceedButtonBgColor),b.style.setProperty("--sns-proceedbtn-border",h?.proceedButtonBorderColor?`1px solid ${h.proceedButtonBorderColor}`:"none"),b.style.setProperty("--sns-proceedbtn-txt-color",h?.proceedButtonTextColor),b.style.setProperty("--sns-addtocartbtn-bg-color",h?.addToCartButtonBgColor),b.style.setProperty("--sns-addtocartbtn-border-color",h?.addToCartButtonBorderColor),b.style.setProperty("--sns-addtocartbtn-txt-color",h?.addToCartButtonTextColor),b.innerHTML=`
    <div class="sr-subscribe-modal-container sr-subscribe-modal-legacy">
      <span class="sr-subscribe-modal-close">${p?le:ae}</span>
      <div class="sr-subscribe-modal-w-100">
        <div class="sr-subscribe-modal-header-container">
          <div class="sr-subscribe-modal-header" title="${e?.subscriptionPlanName}">${e?.subscriptionPlanName??"Subscription Plan"}</div>
          <div class="sr-subscribe-modal-header-price"></div>
        </div>
        <div class="sr-subscribe-modal-subheader">Choose how often you'd like to receive ${o??"product"}</div>
      </div>

      <div class="sr-subscribe-modal-variant sr-subscribe-modal-w-100"></div>
      <div class="sr-subscribe-modal-plans"></div>

      <div class="sr-subscribe-modal-helperContainer">
        <div class="sr-subscribe-modal-infoIcon">${J}</div>
        <div>
          <div class="sr-subscribe-modal-helperHeader">
            Subscription items must be purchased separately.
          </div>
          <div class="sr-subscribe-modal-helperSubtext">
            You can pause or cancel your subscription anytime by reaching out to the seller on ${e?.sellerEmail??""}
          </div>
        </div>
      </div>

      <div class="sr-subscribe-modal-ctaGroup">
        <button class="sr-subscribe-modal-addToCart">
          Add to Cart
        </button>
        <button class="sr-subscribe-modal-proceed">
          Proceed to Checkout
        </button>
      </div>
    </div>
  `,x.appendChild(b),document.body.appendChild(T),x.querySelector(".sr-subscribe-modal-close").onclick=()=>T.remove(),b.onclick=l=>{l.target===b&&T.remove()};let C=x.querySelector(".sr-subscribe-modal-variant"),N=x.querySelector(".sr-subscribe-modal-plans"),y=x.querySelector(".sr-subscribe-modal-header-price"),S=x.querySelector(".sr-subscribe-modal-addToCart");h?.addToCartButtonVisible||(S.style.display="none"),C.innerHTML=`
    <div class="sr-subscribe-modal-inputHeader">Select Variant</div>
    ${f?.length>1?`<select class="sr-subscribe-modal-select">
          ${f.map(l=>`
              <option class="sr-subscribe-modal-option" value="${l.id}"
                ${l.id==s?"selected":""}>
                ${se(l.name,40)}
              </option>`).join("")}
         </select>`:`<div class="sr-subscribe-modal-select" title="${f?.[0]?.name}">
           ${f?.[0]?.name??""}
         </div>`}
  `;let W=()=>{let l=f?.length&&f?.filter(u=>u?.id?.toString()===s)?.length?s:f?.[0]?.id,m=e?.planData[l]||[],F=i?.filter(u=>u?.id==l)?.[0]||{},$=E(m),M=!m?.[0]?.discountAmount,d=m.some(u=>u?.popular),g=(F?.price||0)/100,B=m?.[0]?.discountType==="FLAT"?Math.max(0,g-(m?.[0]?.discountAmount??0)):Math.max(0,g*(1-(m?.[0]?.discountAmount??0)/100));if($?y.innerHTML=`
        ${M?"":`<span class="sr-subscribe-modal-prevPrice">\u20B9${g}</span>`}
        <span class="sr-subscribe-modal-newPrice">
          \u20B9${M?g:B.toFixed(2)}
        </span>
      `:y.innerHTML="",!m.length){N.innerHTML="<p>No plans available</p>";return}N.innerHTML=`
      <div class="sr-subscribe-modal-inputHeader">Subscription Plan </div>
      <div class="sr-subscribe-modal-planList">${m.map((u,k)=>{let v=(F?.price||0)/100,D=u?.discountType==="FLAT"?Math.max(0,v-(u?.discountAmount??0)):Math.max(0,v*(1-(u?.discountAmount??0)/100)),P=!u?.discountAmount;return`
              <div class="sr-subscribe-modal-planOption" data-index="${k}">
                <div class="sr-subscribe-modal-planOptionData">
                  <input type="radio" name="plan" value="${k}" ${(d?u?.popular:k===0)?"checked":""} />
                  <span> ${G()==="www.bennysbowl.com"?"Repeat order every":"Every"} ${u?.intervalFrequency??""} ${(u?.interval??"").toLowerCase()}</span>
                  ${P?"":`<span class="sr-subscribe-modal-planSave">Save  ${u?.discountType==="FLAT"?"\u20B9":""}${u?.discountAmount??""}${u?.discountType==="FLAT"?"":"%"}</span>`}
                </div>
                ${$?"":`<div>
                      ${P?"":`<span class="sr-subscribe-modal-prevPrice">\u20B9${v}</span>`}
                      <span class="sr-subscribe-modal-newPrice">\u20B9${P?v:D.toFixed(2)}</span>
                     </div>`}
                ${u?.popular?'<div class="sr-subscribe-modal-planOption-mostpopular">Most Popular</div>':""}
              </div>
            `}).join("")}</div>`,x.querySelectorAll(".sr-subscribe-modal-planOption").forEach(u=>{u.onclick=()=>{let k=Number(u.dataset.index),v=u.querySelector("input[name='plan']");v.checked=!0,r=m[k]}}),r=m[0]||null};W();let A=x.querySelector(".sr-subscribe-modal-select");A&&(A.onchange=l=>{s=l.target.value,W()});let H=()=>{let{prepaidPlanDetails:l,...m}=r||{};return{...m,planType:"RECURRING"}};x.querySelector(".sr-subscribe-modal-proceed").onclick=l=>{if(!r){alert("Please select a plan");return}ne(s,H(),e,l.currentTarget)},x.querySelector(".sr-subscribe-modal-addToCart").onclick=async l=>{if(!r){alert("Please select a plan");return}let m=l.currentTarget;m.disabled=!0,V({name:"S&S add to cart clicked",payload:{variant:s}});let F=await ie(s,H(),e);if(!F?.ok){m.disabled=!1,alert(F?.error||"Could not add this item to your cart");return}T.remove(),window.location.href="/cart"}};var Se=(e,t)=>{let s=e?.planData?.[t]||[];for(let o of s){let n=(o?.prepaidPlanDetails||[]).find(i=>i?.bestValue);if(n?.discountValue){let i=n?.discountType?.toUpperCase()==="FLAT";return`${i?"\u20B9":""}${n.discountValue}${i?"":"%"}`}}let r=s.find(o=>o?.popular)??{};return r?.discountAmount?`${r?.discountType==="FLAT"?"\u20B9":""}${r?.discountAmount}${r?.discountType!=="FLAT"?"%":""}`:0},Te=e=>{let t=R({}),s=t?.injectContainer;if(!s||document.querySelector(".sr-sns-shadow-host"))return;let r=L(),o=Se(e,r),n=document.createElement("div");n.className="sr-sns-shadow-host";let i=n.attachShadow({mode:"open"}),p=document.createElement("style");p.textContent=z,i.appendChild(p);let c=document.createElement("button");c.className="sr-subscribe-btn",c.type="button",c.innerText=t?.buttonText?t?.buttonText:o?`Subscribe & Save up to ${o}`:"Subscribe & Save",c.style.backgroundColor=t?.buttonBgColor,c.style.borderColor=t?.buttonBorderColor,c.style.color=t?.buttonTextColor,c.style.marginTop=`${t?.marginTop}px`,c.style.marginBottom=`${t?.marginBottom}px`,t?.buttonWidth&&(c.style.width=t?.buttonWidth),c.onclick=()=>{Ce(e),V({name:"S&S button clicked",payload:{variant:L()}})},i.appendChild(c),n.setAttribute("style","display:block !important"),s.appendChild(n);let w=()=>{let f=L(),E=e?.planData?.[f]?.length,T=Se(e,f);c.innerText=t?.buttonText?t?.buttonText:T?`Subscribe & Save up to ${T}`:"Subscribe & Save",c.style.display=E?"block":"none"};w(),document.addEventListener("change",f=>{f.target.name==="id"&&w()})};var Le=async()=>{let e=Y(),t=G();if(!e||!t)return;let s=await he(e,t);if(!s?.planData||Object.keys(s?.planData||{})?.length===0)return;let r=setInterval(()=>{re()&&(Te(s),clearInterval(r))},500)};setTimeout(Le,1e3);})();
