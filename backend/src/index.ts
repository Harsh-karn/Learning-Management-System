import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const rolesToCreate = ['Content Manager', 'Instructor', 'Student'];
    const roleService = strapi.plugin('users-permissions').service('role');
    
    const existingRoles = await strapi.db.query('plugin::users-permissions.role').findMany();
    const existingRoleNames = existingRoles.map(r => r.name);

    for (const roleName of rolesToCreate) {
      if (!existingRoleNames.includes(roleName)) {
        await roleService.createRole({
          name: roleName,
          description: `Role for ${roleName}`,
        });
        console.log(`Created role: ${roleName}`);
      }
    }
  },
};
