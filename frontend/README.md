# AegisED frontend

React, JavaScript, Vite, Tailwind CSS, React Router and Recharts. The existing application stack is retained. The interface covers emergency operations, patients and resource directories, analytics, human-reviewed decision support, knowledge retrieval and staff administration.

From this folder:

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Development opens at `http://localhost:5173`. Vite proxies `/api` to Express on port 5000; set the backend's `APP_ORIGIN` to this frontend origin. For the production bundle, Express serves `frontend/dist` and supports direct route refresh.

The browser uses same-origin cookies and an in-memory anti-CSRF token. It never receives the private Python service token. Role-aware navigation complements server-side authorization. Forms use explicit accessible labels, dialogs retain native keyboard behavior, and wide tables scroll inside their containers on small screens.

See [complete setup](../docs/LOCAL_SETUP.md), [API reference](../docs/API.md), [browser test instructions](../docs/TESTING.md) and [verification evidence](../docs/VERIFICATION.md). Legacy sample data and assets are retained for continuity; active pages fetch their records from the API.

