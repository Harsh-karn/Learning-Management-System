export default () => {
  return async (ctx: any, next: any) => {
    if (ctx.request.path === '/api/debug-proxy') {
      ctx.body = {
        secure: ctx.secure,
        protocol: ctx.protocol,
        headers: ctx.request.headers,
        proxy: ctx.app.proxy
      };
      return;
    }
    await next();
  };
};
