import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getUser, getBestScores, getEvents, getNetwork, saveGame } from "./dao.js"
import { buildDoubleLinkedList, generateRoute, validateSubmittedRoute, generateRandomEvents } from "./network-builder.js";


// init express
const app = express();
const port = 3001;


// Set up middlewares
app.use(morgan("dev"));
app.use(express.json());

// Set up CORS with credentials to allow session cookies
app.use(cors({
  origin: "http://localhost:5173", // React client Vite port
  credentials: true
}));


//authentication workflow
passport.use(new LocalStrategy(async function checkCredentials(username, password, cb) {
  try {
    const user = await getUser(username, password);

    if (!user) {
      return cb(null, false, "Wrong credentials. Access denied");
    }
    return cb(null, user);

  } catch (err) {
    return cb(err);
  }
}));

// Serialize/Deserialize user
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log(req.user)
  return res.status(401).json({ error: "Not authorized" });
}

// Set up Session
app.use(session({
  secret: "my beautiful webapp exam secret key...",
  resave: false, // avoids saving session on every request if unmodified
  saveUninitialized: false // avoids saving session if not initialized
}));
app.use(passport.initialize());
app.use(passport.session());

//ROUTES - authentication

// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});


// Variabile globale per salvare la double-linked list
let globalGraph = null;

// ROUTES - game

app.get("/api/network", checkLoggedIn, async (req, res) => {
  try {
    // Il DAO prende i dati dal database
    const network = await getNetwork();

    // Costruiamo e salviamo la double-linked list nella variabile globale
    // (lo facciamo solo la prima volta, o la ricreiamo ogni volta, per sicurezza la salviamo)
    const { stations, linesMap } = buildDoubleLinkedList(network);
    globalGraph = { stations, linesMap };

    // E li mandiamo al frontend come richiesto
    return res.json(network);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting network data" });
  }
})

// Endpoint per ottenere il percorso casuale per l'inizio del gioco
app.post("/api/games/setup", checkLoggedIn, async (req, res) => {
  try {
    if (!globalGraph) {
      // Nel caso in cui il setup venga chiamato prima del network, lo carichiamo
      const network = await getNetwork();
      const { stations, linesMap } = buildDoubleLinkedList(network);
      globalGraph = { stations, linesMap };
    }

    const route = generateRoute(globalGraph.stations, globalGraph.linesMap);

    // SALVIAMO LE STAZIONI ASSEGNATE NELLA SESSIONE (Server-side)
    req.session.assignedRoute = {
      startId: route.start.id,
      endId: route.end.id
    };

    return res.json(route);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error generating random route" });
  }
})

// Endpoint per validare il percorso inviato dal client ed eseguire gli eventi
app.post("/api/games/validate", checkLoggedIn, async (req, res) => {
  try {
    const { segments, startTimestamp, endTimestamp } = req.body;

    // Controllo cheat: Il tempo impiegato non deve superare i 90 secondi (più 5 secondi di tolleranza latenza rete)
    if (startTimestamp && endTimestamp) {
      const elapsedMs = endTimestamp - startTimestamp;
      if (elapsedMs > 93000) {
        // Tempo scaduto, punteggio azzerato
        await saveGame(req.user.username, 0);
        return res.status(400).json({
          isValid: false,
          error: "Tempo scaduto! Hai impiegato più di 90 secondi.",
          finalScore: 0
        });
      }
    }

    // Recuperiamo partenza e arrivo DALLA SESSIONE, non dal body!
    const assignedRoute = req.session.assignedRoute;

    if (!assignedRoute) {
      return res.status(400).json({
        isValid: false,
        error: "Nessun percorso assegnato trovato in sessione. Inizia prima una partita.",
        finalScore: 0
      });
    }

    const { startId, endId } = assignedRoute;

    if (!globalGraph) {
      const network = await getNetwork();
      const { stations, linesMap } = buildDoubleLinkedList(network);
      globalGraph = { stations, linesMap };
    }

    const validationResult = validateSubmittedRoute(globalGraph.stations, globalGraph.linesMap, segments, Number(startId), Number(endId));


    // Resettiamo la partita in sessione, sia in caso di vittoria che di sconfitta
    req.session.assignedRoute = null;

    if (!validationResult.isValid) {
      // Se il percorso è invalido, il giocatore perde le sue 20 monete e il gioco finisce con score = 0
      // Dobbiamo anche salvare il punteggio di 0 nel database
      await saveGame(req.user.username, 0);

      return res.status(400).json({
        isValid: false,
        error: validationResult.error,
        finalScore: 0
      });
    }

    return res.json({
      isValid: true,
      numStations: segments.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error validating route and executing game" });
  }
})

//GET api/events

app.post("/api/events", checkLoggedIn, async (req, res) => {
  try {
    const numStations = req.query.numStations;
    const events = await getEvents();




    if (numStations) {
      const selectedEvents = generateRandomEvents(events, parseInt(numStations));
      let score = 20;
      selectedEvents.forEach((e) => {
        score += e.bonus;
        if (score < 0) score = 0;
      });
      await saveGame(req.user.username, score);
      return res.json(selectedEvents);
    }

    return res.json(events);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting events" });
  }
})


//GET api/scores 
app.get("/api/games", checkLoggedIn, async (req, res) => {
  try {
    const games = await getBestScores();
    return res.json(games);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error getting best scores data" });
  }
})




// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
