import { LoginHandler } from './commends/login/login.handler';
import { RegisterHandler } from './commends/register/register.handler';
import { MeHandler } from './queries/me/me.handler';

export const CommendHandlers = [RegisterHandler, LoginHandler];
export const QueryHandlers = [MeHandler];
