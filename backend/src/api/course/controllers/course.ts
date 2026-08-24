import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to create a course.');

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Student') {
      return ctx.forbidden('Students cannot create courses.');
    }

    // Automatically set the instructor to the current user if they are an Instructor
    if (roleName === 'Instructor') {
      if (!ctx.request.body.data) ctx.request.body.data = {};
      ctx.request.body.data.instructor = user.id;
    }

    const response = await super.create(ctx);
    return response;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Instructor') {
      const course = await strapi.entityService.findOne('api::course.course', id, { populate: ['instructor'] });
      if (!course) return ctx.notFound();
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('You can only update your own courses.');
      }
    }

    const response = await super.update(ctx);
    return response;
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Instructor') {
      const course = await strapi.entityService.findOne('api::course.course', id, { populate: ['instructor'] });
      if (!course) return ctx.notFound();
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('You can only delete your own courses.');
      }
    }

    const response = await super.delete(ctx);
    return response;
  }
}));