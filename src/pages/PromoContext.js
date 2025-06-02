import React, { createContext, useState } from "react";

export const PromoContext = createContext();

export const PromoProvider = ({ children }) => {
  const [promoState, setPromoState] = useState({
    validPromo: null,
    discountAmount: 0,
  });

  return (
    <PromoContext.Provider value={{ promoState, setPromoState }}>
      {children}
    </PromoContext.Provider>
  );
};