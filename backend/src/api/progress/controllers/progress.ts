import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::progress.progress', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] })) as any;
    const roleName = userWithRole?.role?.name;

    // Enforce access control at the query level
    if (roleName === 'Student') {
      ctx.query = {
        ...ctx.query,
        filters: {
          ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
          student: { id: user.id }
        }
      };
    } else if (roleName === 'Instructor') {
      ctx.query = {
        ...ctx.query,
        filters: {
          ...(typeof ctx.query.filters === 'object' ? ctx.query.filters : {}),
          course: { instructor: { id: user.id } }
        }
      };
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] })) as any;
    const roleName = userWithRole?.role?.name;

    const progress = (await strapi.entityService.findOne('api::progress.progress', id, {
      populate: ['student', 'course.instructor']
    })) as any;

    if (!progress) return ctx.notFound();

    if (roleName === 'Student' && progress.student?.id !== user.id) {
      return ctx.forbidden('You can only view your own progress.');
    }

    if (roleName === 'Instructor' && progress.course?.instructor?.id !== user.id) {
      return ctx.forbidden('You can only view progress for your own courses.');
    }

    return super.findOne(ctx);
  }
}));