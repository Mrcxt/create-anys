import React from "react";
import ReactDOM from "react-dom/client";
import { useState, useMemo, useCallback } from "react";
import { RouterProvider, useRoutes, HashRouter } from "react-router-dom";
import { ConfigProvider } from "antd-mobile";
import zhCN from "antd-mobile/es/locales/zh-CN";
import VConsole from "vconsole";
import { ModalProvider } from "nice-use-modal";

import { hashRouters } from "@/routers";

import "normalize.css";
import "virtual:uno.css";
import "./styles/reset.css";

const App = () => {
  console.log("import.meta.env", import.meta.env);

  import.meta.env.MODE !== "prod" && new VConsole();

  return (
    <ConfigProvider locale={zhCN}>
      <ModalProvider>
        <RouterProvider router={hashRouters} />
      </ModalProvider>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
