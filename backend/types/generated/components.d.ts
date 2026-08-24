import type { Schema, Struct } from '@strapi/strapi';

export interface QuizQuestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_questions';
  info: {
    displayName: 'Question';
    icon: 'question';
  };
  attributes: {
    correctOptionIndex: Schema.Attribute.Integer & Schema.Attribute.Required;
    options: Schema.Attribute.JSON & Schema.Attribute.Required;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'quiz.question': QuizQuestion;
    }
  }
}
