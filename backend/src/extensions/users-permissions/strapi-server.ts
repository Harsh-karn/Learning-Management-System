export default (plugin: any) => {
  const originalLogin = plugin.controllers.auth.callback;
  
  plugin.controllers.auth.callback = async (ctx: any) => {
    try {
      await originalLogin(ctx);
    } catch (err: any) {
      if (err.status === 500 || !err.status) {
        ctx.status = 400;
        ctx.body = {
          error: {
            message: err.message,
            stack: err.stack,
            name: err.name,
            details: err.details
          }
        };
      } else {
        throw err;
      }
    }
  };

  return plugin;
};
