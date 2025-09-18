import { Router } from 'express';
import metaWebhook from './meta.webhook';

const webhookRouter = Router();

// Mount webhook routes
webhookRouter.use('/meta', metaWebhook);

// TODO: Add other webhook providers here
// webhookRouter.use('/stripe', stripeWebhook);
// webhookRouter.use('/paypal', paypalWebhook);

export default webhookRouter;
