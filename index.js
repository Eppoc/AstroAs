import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 4000;
app.get ("/",(req,res)=>{
    res.send("corriendo");
});
const LOGIN_URL = 'https://id.kajabi.com/u/login';
const CREDENTIALS = {
  username: 'astroas@astroterapeutica.com',
  password: 'u0026grantable##Type'
};
main();
app.use(bodyParser.json());

// Webhook endpoint 
app.post('/', (req, res) => {
  const payload = req.body; //  webhook data
  const id_hook = payload.ID;
  const tipo = payload.tipo;

  
  console.log('Received webhook data:', payload);

  
 

  
  res.status(200).send('Webhook data received.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook listener is running on port ${PORT}`);
});

async function   main(id_hook, tipo) {
    try {
     // const storedCookies = await loadCookies();
      //if (storedCookies && await isSessionValid(storedCookies)) {
        console.log("Sesion lista.");
      //} else {
        await performLogin();
      //}
     // await cap_url(id_hook, tipo);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  async function performLogin() {
    const browser = await puppeteer.launch({
      headless: "new",
      defaultViewport: null
    });
  
    try {
      const page = await browser.newPage();
      await setupRequestInterception(page);
      await page.goto(LOGIN_URL);
  
      console.log("Me loggeo de nuevo...");
      await fillInput(page, '#username', CREDENTIALS.username);
      await fillInput(page, '#password', CREDENTIALS.password);
      await page.click('[data-action-button-primary="true"]');
  
      await page.waitForSelector('[data-action-button-primary="true"]', { hidden: true });
  
      console.log('loggeado');
      //const newCookies = await page.cookies();
      //await saveCookies(newCookies);
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      console.log('Listo...');
      await browser.close();
    }
  }

  async function fillInput(page, selector, value) {
    await page.waitForSelector(selector);
    await page.type(selector, value);
  }

  async function setupRequestInterception(page) {
    await page.setRequestInterception(true);
  
    page.on('request', (request) => {
      const resourceTypesToBlock = ['stylesheet', 'font', 'image'];
      if (resourceTypesToBlock.includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }