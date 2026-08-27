export default () => {
  return async (ctx: any, next: any) => {
    // Forcefully enable proxy trust for Koa if it wasn't set by Strapi config
    ctx.app.proxy = true;

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
