const fs = require('fs');
const path = require('path');

const apis = [
  {
    name: 'course',
    schema: {
      kind: 'collectionType',
      collectionName: 'courses',
      info: { singularName: 'course', pluralName: 'courses', displayName: 'Course', description: '' },
      options: { draftAndPublish: false },
      pluginOptions: {},
      attributes: {
        title: { type: 'string', required: true },
        description: { type: 'text' },
        instructor: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user', inversedBy: 'courses_instructing' },
        students: { type: 'relation', relation: 'manyToMany', target: 'plugin::users-permissions.user', inversedBy: 'enrolled_courses' },
        lessons: { type: 'relation', relation: 'oneToMany', target: 'api::lesson.lesson', mappedBy: 'course' },
        quiz: { type: 'relation', relation: 'oneToOne', target: 'api::quiz.quiz', mappedBy: 'course' }
      }
    }
  },
  {
    name: 'lesson',
    schema: {
      kind: 'collectionType',
      collectionName: 'lessons',
      info: { singularName: 'lesson', pluralName: 'lessons', displayName: 'Lesson', description: '' },
      options: { draftAndPublish: false },
      pluginOptions: {},
      attributes: {
        title: { type: 'string', required: true },
        content: { type: 'richtext' },
        videoUrl: { type: 'string' },
        sequence: { type: 'integer', required: true },
        course: { type: 'relation', relation: 'manyToOne', target: 'api::course.course', inversedBy: 'lessons' }
      }
    }
  },
  {
    name: 'progress',
    schema: {
      kind: 'collectionType',
      collectionName: 'progresses',
      info: { singularName: 'progress', pluralName: 'progresses', displayName: 'Progress', description: '' },
      options: { draftAndPublish: false },
      pluginOptions: {},
      attributes: {
        completed: { type: 'boolean', default: false },
        student: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' },
        lesson: { type: 'relation', relation: 'manyToOne', target: 'api::lesson.lesson' },
        course: { type: 'relation', relation: 'manyToOne', target: 'api::course.course' }
      }
    }
  },
  {
    name: 'quiz',
    schema: {
      kind: 'collectionType',
      collectionName: 'quizzes',
      info: { singularName: 'quiz', pluralName: 'quizzes', displayName: 'Quiz', description: '' },
      options: { draftAndPublish: false },
      pluginOptions: {},
      attributes: {
        title: { type: 'string', required: true },
        course: { type: 'relation', relation: 'oneToOne', target: 'api::course.course', inversedBy: 'quiz' },
        questions: { type: 'component', repeatable: true, component: 'quiz.question' }
      }
    }
  },
  {
    name: 'quiz-result',
    schema: {
      kind: 'collectionType',
      collectionName: 'quiz_results',
      info: { singularName: 'quiz-result', pluralName: 'quiz-results', displayName: 'QuizResult', description: '' },
      options: { draftAndPublish: false },
      pluginOptions: {},
      attributes: {
        score: { type: 'integer', required: true },
        student: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' },
        quiz: { type: 'relation', relation: 'manyToOne', target: 'api::quiz.quiz' }
      }
    }
  },
  {
    name: 'blog-post',
    schema: {
      kind: 'collectionType',
      collectionName: 'blog_posts',
      info: { singularName: 'blog-post', pluralName: 'blog-posts', displayName: 'BlogPost', description: '' },
      options: { draftAndPublish: true },
      pluginOptions: {},
      attributes: {
        title: { type: 'string', required: true },
        body: { type: 'richtext' },
        coverImageUrl: { type: 'string' },
        author: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' }
      }
    }
  }
];

const components = [
  {
    category: 'quiz',
    name: 'question',
    schema: {
      collectionName: 'components_quiz_questions',
      info: { displayName: 'Question', icon: 'question' },
      options: {},
      attributes: {
        text: { type: 'string', required: true },
        options: { type: 'json', required: true },
        correctOptionIndex: { type: 'integer', required: true }
      }
    }
  }
];

const baseDir = path.join(__dirname, 'src');

function createApi(api) {
  const apiDir = path.join(baseDir, 'api', api.name);
  fs.mkdirSync(path.join(apiDir, 'content-types', api.name), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'controllers'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'routes'), { recursive: true });
  fs.mkdirSync(path.join(apiDir, 'services'), { recursive: true });

  fs.writeFileSync(path.join(apiDir, 'content-types', api.name, 'schema.json'), JSON.stringify(api.schema, null, 2));
  
  fs.writeFileSync(path.join(apiDir, 'controllers', `${api.name}.ts`), `
import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::${api.name}.${api.name}');
  `.trim());

  fs.writeFileSync(path.join(apiDir, 'routes', `${api.name}.ts`), `
import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::${api.name}.${api.name}');
  `.trim());

  fs.writeFileSync(path.join(apiDir, 'services', `${api.name}.ts`), `
import { factories } from '@strapi/strapi';
export default factories.createCoreService('api::${api.name}.${api.name}');
  `.trim());
}

function createComponent(comp) {
  const compDir = path.join(baseDir, 'components', comp.category);
  fs.mkdirSync(compDir, { recursive: true });
  fs.writeFileSync(path.join(compDir, `${comp.name}.json`), JSON.stringify(comp.schema, null, 2));
}

apis.forEach(createApi);
components.forEach(createComponent);

console.log('Successfully generated Strapi schemas.');
