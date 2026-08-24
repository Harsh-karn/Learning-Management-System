import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] });
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Student') {
      return ctx.forbidden('Students cannot create lessons.');
    }

    if (roleName === 'Instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required.');
      
      const course = await strapi.entityService.findOne('api::course.course', courseId, { populate: ['instructor'] });
      if (!course) return ctx.notFound('Course not found.');
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('You can only add lessons to your own courses.');
      }
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
      const lesson = await strapi.entityService.findOne('api::lesson.lesson', id, { populate: ['course.instructor'] });
      if (!lesson) return ctx.notFound();
      if (lesson.course?.instructor?.id !== user.id) {
        return ctx.forbidden('You can only update lessons in your own courses.');
      }
      
      // Also prevent moving lesson to another instructor's course
      const newCourseId = ctx.request.body.data?.course;
      if (newCourseId && newCourseId !== lesson.course?.id) {
        const newCourse = await strapi.entityService.findOne('api::course.course', newCourseId, { populate: ['instructor'] });
        if (newCourse?.instructor?.id !== user.id) {
          return ctx.forbidden('You cannot move a lesson to a course you do not own.');
        }
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
      const lesson = await strapi.entityService.findOne('api::lesson.lesson', id, { populate: ['course.instructor'] });
      if (!lesson) return ctx.notFound();
      if (lesson.course?.instructor?.id !== user.id) {
        return ctx.forbidden('You can only delete lessons from your own courses.');
      }
    }

    const response = await super.delete(ctx);
    return response;
  }
}));