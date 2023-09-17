import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from "puppeteer";
const LOGIN_URL = 'https://id.kajabi.com/u/login';
const CREDENTIALS = {
  username: 'astroas@astroterapeutica.com',
  password: 'u0026grantable##Type'
};
const app = express();
const PORT = process.env.PORT || 3000;
app.get ("/",(req,res)=>{
    res.send("corriendo");
});


app.use(bodyParser.urlencoded({ extended: false }));

// Webhook endpoint 
app.post('/', (req, res) => {
  const payload = req.body; //  webhook data
  const id_hook = payload.ID;
  const tipo = payload.tipo;

  
  console.log('Received webhook data:', payload);
  if (id_hook && tipo) {
    try {
       main(id_hook, tipo);
      console.log('Successfully executed main()');
    } catch (error) {
      console.error('Error in main():', error);
    }
  } else {
    console.log("No se han recibido los datos necesarios");
  }
  
 

  
  res.status(200).send('Webhook data received.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook listener is running on port ${PORT}`);
});

async function main(id_hook, tipo) {
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
    const browser = await puppeteer.connect({
        browserWSEndpoint: 'wss://chrome.browserless.io/?token=7acf2bfa-1a88-4850-90ac-3df9b8f6d45f&stealth',
        ignoreHTTPSErrors: true
      });
  
    try {
      const page = await browser.newPage();
     
      await setupRequestInterception(page);
      await page.goto(LOGIN_URL);
     // await page.waitForNavigation();
      console.log("Me loggeo de nuevo...");
      await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
      await page.evaluate((CREDENTIALS) => {
        // Rellenar el campo de usuario y contraseña
        const $username = document.querySelector('#username');
        const $password = document.querySelector('#password');
        const $loginButton = document.querySelector('[data-action-button-primary="true"]');
        
        if ($username && $password && $loginButton) {
          $username.value = CREDENTIALS.username;
          $password.value = CREDENTIALS.password;
          $loginButton.click();
        } else {
          console.error('Elementos no encontrados en la página.');
        }
      }, CREDENTIALS);
     
      
  
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
       return request.abort();
      } else {
       return request.continue();
      }
    });
  }