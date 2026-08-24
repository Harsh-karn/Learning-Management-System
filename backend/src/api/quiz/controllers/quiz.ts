import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] })) as any;
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Student') {
      return ctx.forbidden('Students cannot create quizzes.');
    }

    if (roleName === 'Instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required.');
      
      const course = (await strapi.entityService.findOne('api::course.course', courseId, { populate: ['instructor'] })) as any;
      if (!course) return ctx.notFound('Course not found.');
      if (course.instructor?.id !== user.id) {
        return ctx.forbidden('You can only add quizzes to your own courses.');
      }
    }

    const response = await super.create(ctx);
    return response;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const userWithRole = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] })) as any;
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Instructor') {
      const quiz = (await strapi.entityService.findOne('api::quiz.quiz', id, { populate: ['course.instructor'] })) as any;
      if (!quiz) return ctx.notFound();
      if (quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('You can only update quizzes in your own courses.');
      }
      
      // Also prevent moving quiz to another instructor's course
      const newCourseId = ctx.request.body.data?.course;
      if (newCourseId && newCourseId !== quiz.course?.id) {
        const newCourse = (await strapi.entityService.findOne('api::course.course', newCourseId, { populate: ['instructor'] })) as any;
        if (newCourse?.instructor?.id !== user.id) {
          return ctx.forbidden('You cannot move a quiz to a course you do not own.');
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

    const userWithRole = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, { populate: ['role'] })) as any;
    const roleName = userWithRole?.role?.name;

    if (roleName === 'Instructor') {
      const quiz = (await strapi.entityService.findOne('api::quiz.quiz', id, { populate: ['course.instructor'] })) as any;
      if (!quiz) return ctx.notFound();
      if (quiz.course?.instructor?.id !== user.id) {
        return ctx.forbidden('You can only delete quizzes from your own courses.');
      }
    }

    const response = await super.delete(ctx);
    return response;
  }
}));