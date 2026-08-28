export default (plugin: any) => {
  const originalMe = plugin.controllers.user.me;

  plugin.controllers.user.me = async (ctx: any) => {
    // Call the original me controller
    await originalMe(ctx);
    
    // If the user is successfully returned, forcefully attach their role
    if (ctx.body && ctx.body.id) {
      const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', ctx.body.id, {
        populate: ['role']
      });
      
      if (userWithRole && (userWithRole as any).role) {
        ctx.body.role = (userWithRole as any).role;
      }
    }
  };

  return plugin;
};
