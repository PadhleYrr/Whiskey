
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills-legacy.sFtv9J1J.js","/cdn/shopifycloud/checkout-web/assets/c1/app-legacy.97Pba5cq.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor-legacy.DgP8KhFR.js","/cdn/shopifycloud/checkout-web/assets/c1/context-browser-legacy.DIJTxvDy.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-previous-legacy.BKsLHVCX.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButton-helpers-legacy.C3omJGY2.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-PaymentSessionMutation-legacy.Druac2hi.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors-legacy.CwDQqKJY.js","/cdn/shopifycloud/checkout-web/assets/c1/addresses-is-address-empty-legacy.mml0v6iA.js","/cdn/shopifycloud/checkout-web/assets/c1/redemption-constants-legacy.BGXIoHw4.js","/cdn/shopifycloud/checkout-web/assets/c1/redemption-promotions-legacy.BIlWCqEa.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-receipt-mapper-load-recovery-legacy.m1GyRq3g.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-receipt-eager-mappers-legacy.UO7WhBBH.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-report-graphql-error-legacy.D2X7eI7w.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-normalizeBuyerDetails-legacy.BfmJm246.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-derivations-legacy.Cqld6DXw.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-credit-card-disabled-legacy.CtxSeeeW.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayNewSignupLoginExperiment-legacy.CwFcwORd.js","/cdn/shopifycloud/checkout-web/assets/c1/hydrate-legacy.Bb6u89pa.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-negotiation-input-redeemable-legacy.bxMCJn-k.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-permissions-legacy.DRuj-1UG.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayExternalAppContext-legacy.4SvuH4xB.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en-legacy.9IdIv0Ow.js","/cdn/shopifycloud/checkout-web/assets/c1/OnePage-legacy.BcCJMsz8.js","/cdn/shopifycloud/checkout-web/assets/c1/components-VatNumberValidationField-legacy.iwmbspi5.js","/cdn/shopifycloud/checkout-web/assets/c1/localization-index-legacy.BkgIHUtv.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName-legacy.B9oSD4eT.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowShopPayOptin-legacy.CddZ1Upc.js","/cdn/shopifycloud/checkout-web/assets/c1/AddressPresenter-legacy.5rhm8D9V.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShouldRevealCustomization-legacy.DzyD4OaT.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl-legacy.U7L7jD8-.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink-legacy.C32eg88d.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressForm-legacy.CJwiyHPR.js","/cdn/shopifycloud/checkout-web/assets/c1/components-RedirectionNotice.module-legacy.B2A7zpQT.js","/cdn/shopifycloud/checkout-web/assets/c1/amazon-pay-useAmazonPayPaymentLine-legacy.D-qIUm5Z.js","/cdn/shopifycloud/checkout-web/assets/c1/PhoneField-legacy.B8RyXLd2.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSuppressShopPayModalOnLoad-legacy.N_9ZtGU-.js","/cdn/shopifycloud/checkout-web/assets/c1/Popover-legacy.ri1b4W8H.js","/cdn/shopifycloud/checkout-web/assets/c1/business-customer-constants-legacy.DQpDR0h7.js","/cdn/shopifycloud/checkout-web/assets/c1/Choice-legacy.CFOlZsJ8.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-publishMessage-legacy.mv4IjUX5.js","/cdn/shopifycloud/checkout-web/assets/c1/Checkbox-legacy.DGdaw5fY.js","/cdn/shopifycloud/checkout-web/assets/c1/ImpressionEventCapture-legacy.DPrpWK9e.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo-legacy.DDwOsDvt.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout-legacy.CtJqojRM.js","/cdn/shopifycloud/checkout-web/assets/c1/Page-legacy.YfrMJ2EH.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsMonorailTrack-legacy.itTLraSE.js","/cdn/shopifycloud/checkout-web/assets/c1/crypto-constants-legacy.Cp30v8Ae.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-installments-monorail-legacy.B5K0PnwI.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePickupPoints-legacy.Daa_tVav.js","/cdn/shopifycloud/checkout-web/assets/c1/TransitionHeight-legacy.BztnUPHV.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks-legacy.pRnoqmsG.js","/cdn/shopifycloud/checkout-web/assets/c1/PendingShipping-legacy.BilgookH.js","/cdn/shopifycloud/checkout-web/assets/c1/StickyPayButton-StickyPayButton.module-legacy.D8xta8Mc.js","/cdn/shopifycloud/checkout-web/assets/c1/Switch-legacy.Drb7uqlk.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-payment-button-legacy.gc0bPSQe.js","/cdn/shopifycloud/checkout-web/assets/c1/useAddressMutationsWithNegotiation-legacy.PGxbk06E.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentIcon-legacy.CJK1gDge.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentLine-legacy.Bf_NFf6F.js","/cdn/shopifycloud/checkout-web/assets/c1/Theme-ThemeOverride-legacy.XuSUbfv6.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress-legacy.DIVn5Qza.js","/cdn/shopifycloud/checkout-web/assets/c1/payment-usePaymentExemptionReason-legacy.Cg6D5_Xf.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayProgressIntercepts-legacy.C9hEtlh1.js","/cdn/shopifycloud/checkout-web/assets/c1/Section-legacy.3gJcp8vb.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner-legacy.CruuVQRN.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage-legacy.Cg9Enmpg.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePreselectSpi-legacy.CAjAQIuc.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-as-guest-amazon-pay-legacy.Bybjn5iX.js","/cdn/shopifycloud/checkout-web/assets/c1/Middot-legacy.ydweCiy0.js","/cdn/shopifycloud/checkout-web/assets/c1/EstimatedDeliveryContent-legacy.6VPoPVgR.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodRateLabel-legacy.2MUtyJ5i.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-methods-consolidated-included-legacy.CFR6lbeO.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingLines-legacy.QEGphGMQ.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown-legacy.C5uVa177.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal-legacy.DAUzCSee.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector-legacy.XVSLrRVt.js","/cdn/shopifycloud/checkout-web/assets/c1/TextArea-legacy.BFJMtKXw.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown-legacy.5ef-v5ky.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList-legacy.BUxv9cgv.js","/cdn/shopifycloud/checkout-web/assets/c1/page-BelowTheFoldContent-legacy.BHQmILl2.js","/cdn/shopifycloud/checkout-web/assets/c1/Captcha-legacy.DOEBdxb4.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayCaptcha-legacy.BU__hZDD.js","/cdn/shopifycloud/checkout-web/assets/c1/RememberMeSection-legacy.DqA2jtnF.js","/cdn/shopifycloud/checkout-web/assets/c1/components-PaymentMethodProgressionHost-legacy.C-6GiFxR.js","/cdn/shopifycloud/checkout-web/assets/c1/component-MobileOrderSummary-legacy.DIMxq64e.js","/cdn/shopifycloud/checkout-web/assets/c1/styles-floating-layer.module-legacy.d_0DDEyQ.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButtonSection-legacy.CyLj8pec.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons-legacy.2Cz9K_1Q.js","/cdn/shopifycloud/checkout-web/assets/c1/utils-useViolationsHandler-legacy.CrLKoyvT.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentOptionSelector-legacy.KpB-DN0_.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressSelector-legacy.D5-ECe5L.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useStableHostMethodsReferences-legacy.CXSvtxfW.js"];
      var styles = [];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  