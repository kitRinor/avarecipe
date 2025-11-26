import { Env } from "hono";

export interface AppEnv extends Env {
  Variables: {
    userId: string | null;
  };
  Bindings: {}; 
};

export interface ErrRes {
  message: string;
}