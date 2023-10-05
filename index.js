import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from "puppeteer";
import { readFile, writeFile } from "fs/promises";
import { initializeApp } from "firebase/app";
import { getFirestore,doc, setDoc } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yhfyasuswpdzupdzllvo.supabase.co';
const xx = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnlhc3Vzd3BkenVwZHpsbHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk5ODM4NTcsImV4cCI6MjAwNTU1OTg1N30.ORQTRiX-X72q81RcsXww1nk75POlGgHQwKX6Meb4wzk";
const supabaseKey = xx;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
   // storage: AsyncStorage,
    //autoRefreshToken: true,
    persistSession: false,
   // detectSessionInUrl: true,
  },
  //localStorage: window.localStorage, // Deshabilitar el almacenamiento persistente de sesiones
});
/*______________________________________________________________________ */

const firebaseConfig = {
  apiKey: "AIzaSyA8s0DVN4hGIULUyq-9Acf8LyTmIxGMANc",
  authDomain: "log-astroas.firebaseapp.com",
  projectId: "log-astroas",
  storageBucket: "log-astroas.appspot.com",
  messagingSenderId: "482097460568",
  appId: "1:482097460568:web:af6c8108cbd819b881212d"
};

// Initialize Firebase
const appfb = initializeApp(firebaseConfig);
const db = getFirestore(appfb);


const LOGIN_URL = 'https://id.kajabi.com/u/login';
const CREDENTIALS = {
  username: 'astroas@astroterapeutica.com',
  password: 'u0026grantable##Type'
};
const COOKIE_FILE_PATH = 'cookies.json';
const SESSION_COOKIE_NAME = "_kjb_session";
const app = express();
const PORT = process.env.PORT || 10000;
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
  console.log('Received webhook data:', id_hook, tipo);
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
      const storedCookies = await loadCookies();
     if (storedCookies && await isSessionValid(storedCookies)) {
        console.log("Sesion lista.");
     } else {
        await performLogin();
     }
     await cap_url(id_hook, tipo);
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
     
      await page.waitForSelector('[data-action-button-primary="true"]', { hidden: true });
  
      console.log('loggeado');
      const newCookies = await page.cookies();
      await saveCookies(newCookies);
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      console.log('Listo...');
      const pages = await browser.pages();
      await Promise.all(pages.map(async (page) => await page.close()));
      await browser.close();
    }
  }

  //async function fillInput(page, selector, value) {
    //await page.waitForSelector(selector);
    //await page.type(selector, value);
  //}

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


  async function loadCookies() {
    try {
      const fileData = await readFile(COOKIE_FILE_PATH, 'utf-8');
      const cookies = JSON.parse(fileData);
      return cookies;
    } catch (error) {
      console.error('No stored cookies found.');
      return null;
    }
  }
  
  async function saveCookies(cookies) {
    await writeFile(COOKIE_FILE_PATH, JSON.stringify(cookies));
    console.log('Cookies guardada.');
  }

  async function isSessionValid(savedCookies) {
    try {
      if (!savedCookies) {
        console.log('No hay cookies.');
        return false;
      }
  
      const sessionCookie = savedCookies.find(cookie => cookie.name === SESSION_COOKIE_NAME);
  
      if (!sessionCookie) {
        console.log('la cookie _KBJ_ no existe.');
        return false;
      }
  
      const expirationDate = new Date(sessionCookie.expires * 1000);
      const currentDate = new Date();
  console.log('expiracion: ' ,expirationDate);
  console.log ('hoy: ', currentDate);
      if (currentDate > expirationDate) {
        console.log("Sesion expirada.");
        return false;
      } else {
        console.log("Sesion valida.");
        return true;
      }
    } catch (error) {
      console.error('Error while checking session validity:', error);
      return false;
    }
  }

  async function cap_url(id_hook, tipo) {
    const P_ID = id_hook;
    try {
      const urlMappings = {
        "PU": {
          apiUrl: "https://app.kajabi.com/admin/api/purchases/charge/",
          pageUrl: "https://app.kajabi.com/admin/purchases/charge/",
          tabla_relaciones: "relaciones_idkaj_idpaypal"
        },
        "MP": {
          apiUrl: "https://app.kajabi.com/admin/api/purchases/multiple_payments/",
          pageUrl: "https://app.kajabi.com/admin/purchases/multiple_payments/",
          tabla_relaciones: "relaciones_idkaj_idpaypal_MP"
        },
        "SUS": {
          apiUrl: "https://app.kajabi.com/admin/api/purchases/subscription/",
          pageUrl: "https://app.kajabi.com/admin/purchases/subscription/",
          tabla_relaciones: "relaciones_idkaj_idpaypal_SUS"
        }
      };
  
      if (tipo in urlMappings) {
        const { apiUrl, pageUrl, tabla_relaciones } = urlMappings[tipo];
        const URL_ID = apiUrl + id_hook + "/transactions";
        const URL_ID_C = pageUrl + id_hook;
        const T_rel= tabla_relaciones
        
        //console.log('URL:', URL_ID, 'Page URL:', URL_ID_C);
        await mandar_data(URL_ID, URL_ID_C, T_rel,P_ID);
      } else {
        console.log("Invalid tipo.");
      }
    } catch (error) {
      console.error('Error in cap_url:', error);
    }
  }

  async function mandar_data(URL_ID, URL_ID_C, T_rel,P_ID) {
    const browser = await launchBrowser();
    try {
      const page = await openPage(browser, URL_ID, URL_ID_C,T_rel,P_ID);
      console.log('Entre a:', URL_ID);
          console.log('Entre a:', URL_ID_C);
      
      
    } catch (error) {
      //console.error('Error no hay datos', error);
      console.log('Error no hay datos-repetir');
    } finally {
      await closeBrowser(browser);
      console.log("terminado________________________________________________");
    }
  }

  async function launchBrowser() {
    return  await puppeteer.connect({
        browserWSEndpoint: 'wss://chrome.browserless.io/?token=2747729f-0c40-40db-aa78-49503bab2f5c&stealth',
        ignoreHTTPSErrors: true
      });
  }

  async function closeBrowser(browser) {
    const pages = await browser.pages();
    await Promise.all(pages.map(async (page) => await page.close()));
    await browser.close();
  }

  async function openPage(browser, url,urlc,T_rel,P_ID) {
    const page = await browser.newPage();
    const pagec = await browser.newPage();
    //console.log(urlc);
    await page.setJavaScriptEnabled(false);
    await pagec.setJavaScriptEnabled(false);
    await setupRequestInterception(page);
    await setupRequestInterception(pagec);
    const storedCookies = await loadCookies();
    if (storedCookies) {
      await page.setCookie(...storedCookies);
      await pagec.setCookie(...storedCookies);
    }
    await page.goto(url);
    const jsoncontenido = await page.evaluate (()=>{
      return document.body.textContent;
        });
        let jsondata = null;
        if(jsoncontenido){
         jsondata = JSON.parse(jsoncontenido);
        }else{
          console.log("no hay data");
        }
        // console.log(jsondata);
       let idr=null;
       let paypalid=null;
        if (jsondata && jsondata.data){
          const id_recibos = jsondata.data;
         // console.log(id_recibos.attributes.id);
          for (const id_recibo of id_recibos ){
            const dropitems = id_recibo.attributes.dropdownItems;
             idr= id_recibo.attributes.id;
            console.log('ID recibo; ', idr);
             if(dropitems){
              for (const item of dropitems){
                if (item.dropdown_item_type==="copy-to-clipboard"){
                   paypalid = item.clipboard_value;
                  console.log("ID paypal; ",paypalid);
                  
                }
              }
              
             }
          }
          
        }else{
          idr = null;
          paypalid=null;
        }
      
        
                  await pagec.goto(urlc);
                  
                  const jsonScriptContent = await pagec.evaluate(() => {
                 const jsonElement = document.querySelector('#kjb-redux-store-data');
                 if (jsonElement) {
                   return jsonElement.textContent;
                 }
                 return null;
               });
               let offerPurchaseCouponCode = null;
               let pathValue = null;
               if (jsonScriptContent) {
                 const jsonData = JSON.parse(jsonScriptContent);
                  offerPurchaseCouponCode = jsonData.data.attributes.offerPurchaseCouponCode;
                  if(offerPurchaseCouponCode==null){
                    offerPurchaseCouponCode="Sin cupón";
                    
                  }else{
                    console.log("Con cupón");
                  }
                  pathValue = jsonData.data.attributes.contactPath;
   
                 console.log("Nombre de Cupón:", offerPurchaseCouponCode);
                 console.log("URL Usuario:", pathValue);
                // console.log("ID:", P_ID);
               }else{
                pathValue = null;
                offerPurchaseCouponCode =null;
               }
            
             // envía valores a Supabase
             if (idr===null){
              console.log("no hay data");
             // await writeToFirestore(P_ID,idr,paypalid,offerPurchaseCouponCode,pathValue);
             }else{
             await enviar_data_supabase(P_ID,idr,paypalid,offerPurchaseCouponCode,pathValue,T_rel);
             //await writeToFirestore(P_ID,idr,paypalid,offerPurchaseCouponCode,pathValue);
             }
         
           
    return page;
  }

  async function enviar_data_supabase(P_ID,idr,paypalid,offerPurchaseCouponCode,pathValue,T_rel){
    const { data, error } = await supabase
             .from(T_rel)
             .insert({
                 id_kj: P_ID,
                 id_pp: paypalid,
                 id_recibo:idr,
                 cupon: offerPurchaseCouponCode,
                 url_id_user: pathValue
             })
             .select()
             if (error) {
              console.error('Error al enviar datos a Supabase:', error);
            } else {
              console.log('Datos enviados a Supabase:', data);
            }
  }
  /*______________________________________________________________________ */
  async function writeToFirestore(P_ID,idr,paypalid,offerPurchaseCouponCode,pathValue) {
    const hoy = new Date();
    try {
      await setDoc(doc(db, "LOG-General", P_ID), {
        kj_id: idr,
        pp_id: paypalid,
        cupon: offerPurchaseCouponCode,
        url_us:pathValue,
        fecha: hoy
      });
      console.log("Document successfully written!");
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  }