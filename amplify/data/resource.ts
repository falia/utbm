import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { predictHandler } from '../functions/predict/resource';
import { feedbackHandler } from '../functions/feedback/resource';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Feedback: a
    .model({
      rating: a.string().required(), // 'up' or 'down'
      selectedClass: a.string().required(), // 'Class 1', 'Class 2', etc.
      predictions: a.string().required(), // JSON string of prediction results
      timestamp: a.datetime().required(), // When the prediction was made
      createdAt: a.datetime(), // When the feedback was submitted
    })
    .authorization((allow) => [allow.publicApiKey()]),

  predict: a
    .mutation()
    .arguments({ image: a.string() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(predictHandler)),

  saveFeedback: a
    .mutation()
    .arguments({ 
      rating: a.string().required(),
      selectedClass: a.string().required(),
      predictions: a.string().required(),
      timestamp: a.string().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(feedbackHandler)),

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