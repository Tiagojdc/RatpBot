# N0xx RATP Bot
Installation et lancement 

```bash
docker build -t ratpbot .
docker run -d --env BOT_TOKEN="your-token" --name ratpbot -v /data/ratpBot:/ratpBot/data -v /etc/localtime:/etc/localtime:ro --restart=always ratpbot
```