import { } from "dotenv/config";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import config from "./config/config"

import models from "./models";
import schema from "./schema";
import resolvers from "./resolvers";
import { createApolloServer } from "./utils/apollo-server";

import UserController from "./controllers/user";

// Connect to database
mongoose
  .connect(config.mongodb.uri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`successfully connected to ${config.mongodb.db} DB`))
  .catch((err) => console.error(err));

// Initializes application
const app = express();

// Enable cors
const corsOptions = {
  origin: config.frontend_url,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use(UserController);

const responceHeader = function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Headers', 'authorization');
  res.setHeader('Cache-Control', 'no-cache');

  // Pass to next layer of middleware
  next();
};

app.use(responceHeader);


// Create a Apollo Server
const server = createApolloServer(schema, resolvers, models);
server.applyMiddleware({ app, path: "/graphql" });

// Create http server and add subscriptions to it
const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

// Listen to HTTP and WebSocket server
const PORT = config.port //|| process.env.API_PORT;
httpServer.listen({ port: PORT }, () => {
  console.log(`server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(
    `Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`
  );
});
