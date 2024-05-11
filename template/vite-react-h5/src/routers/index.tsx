/*
 * @LastEditTime: 2024-05-11 11:01:02
 * @Description:
 * @Date: 2024-01-24 16:58:37
 * @Author: @周星星同学
 */
import type { RouteObject } from "react-router-dom";
import { createHashRouter, Navigate } from "react-router-dom";
import { lazy, createElement, Suspense } from "react";
import type { ComponentType, JSX } from "react";
// import { Loading } from "@dandelion/mobile";

interface Route {
  name?: string;
  path: string;
  component?: ComponentType;
  children?: Route[];
}

const rawRouters: Route[] = [
  {
    path: "/",
    component: () => <Navigate to="home" />
  },
  {
    name: "home",
    path: "/home",
    component: lazy(() => import("@/pages/home"))
  },
  {
    name: "404",
    path: "*",
    component: lazy(() => import("@/pages/404"))
  }
];

const createRouter = (routers: Route[]): RouteObject[] =>
  routers.map(({ component: Com, children, ...rest }) => ({
    ...rest,
    element: Com && (
      <Suspense fallback={<>loading...</>}>
        <Com />
      </Suspense>
    ),
    children: children && createRouter(children)
  }));

export const routers = createRouter(rawRouters);

export const hashRouters = createHashRouter(routers);
