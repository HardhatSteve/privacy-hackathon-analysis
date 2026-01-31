import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './routes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

// Basic health check
app.get('/', (req: Request, res: Response) => {
    res.send('PrivyLocker API is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
