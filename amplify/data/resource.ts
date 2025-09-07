import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { predictHandler } from '../functions/predict/resource';
import { feedbackHandler } from '../functions/feedback/resource';
import { historyHandler } from '../functions/history/resource';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  DiagnosisHistory: a
    .model({
      imageName: a.string().required(),
      imagePath: a.string().required(),
      predictions: a.string().required(), // JSON string
      timestamp: a.datetime().required(),
      userId: a.string().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Feedback: a
    .model({
      diagnosisId: a.string().required(),
      rating: a.string().required(), // 'up' or 'down'
      selectedClass: a.string().required(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  predict: a
    .mutation()
    .arguments({ 
      image: a.string().required(),
      imageName: a.string()
    })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(predictHandler)),

  saveFeedback: a
    .mutation()
    .arguments({ 
      diagnosisId: a.string().required(),
      rating: a.string().required(),
      selectedClass: a.string().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(feedbackHandler)),

  getHistory: a
    .query()
    .arguments({
      operation: a.string().required(), // 'list' or 'get'
      diagnosisId: a.string() // required for 'get' operation
    })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(historyHandler)),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});