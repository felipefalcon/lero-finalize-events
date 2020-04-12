  
  const http = require('http');
  var mongo = require('mongodb'); 
  var schedule = require('node-schedule');

  var port = process.env.PORT || 8080;

  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
  });
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });

  const dbName = "leRo_DB";
	const MongoClient = mongo.MongoClient;
  const url = "mongodb+srv://tcc2020:zDOo5kKVvZ0JMzAJ@lero-vjuos.gcp.mongodb.net/test?retryWrites=true&w=majority";
  const paramsM = { useNewUrlParser: true, useUnifiedTopology: true };

  // Variáveis para guardar o dia de hoje e o próximo dia a processar (Next Run começa com a data de hoje e ao processar uma vez é setada ao outra dia)
  // Configurações também para as duas datas estarem com horário, minutos, segundos, milisegundos iguais
  let nextRun = new Date();
  let today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);
  nextRun.setHours(0);
  nextRun.setMinutes(0);
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);


  // Funcção que roda para verificar se a data de hoje é igual ao da próxima vez de processar
  function process() {
      today = new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);

      if (today.toLocaleDateString() == nextRun.toLocaleDateString()) {

        let countEventsToUpdate = 0;
        console.log("\nRodando processo para finalizar eventos de datas anteriores a "+ today.toLocaleDateString() + " ..."); 

        MongoClient.connect(url, paramsM, function(err, db) {
          if (err) throw err;
          var dbo = db.db(dbName);

          dbo.collection("events").find({status: {$eq: 0}}, {projection: {status: 1, data: 1}}).toArray(function(err, result) {
            if (err) throw err;

            if(result){
              let i = 0;
              for(i = 0; i < countEventsToUpdate; ++i){
                let event = result[i];
                let dateEvent = new Date(event.data);
                dateEvent.setHours(0);
                dateEvent.setMinutes(0);
                dateEvent.setSeconds(0);
                dateEvent.setMilliseconds(0);
                if(dateEvent.getTime() < today.getTime()){
                  countEventsToUpdate++;
                  let eventId = new require('mongodb').ObjectID(event._id);
                  dbo.collection("events").updateOne({_id: eventId}, {$set: {status: 2}}, {upsert: true}, function(err, result) {
                    if (err) throw err;
                  });
                }
              }
              if(i+1 == countEventsToUpdate) db.close();
            }

            console.log(countEventsToUpdate+ " evento(s) teve/tiveram seu status atualizado. ");
            console.log("Eventos com data menor que "+ today.toLocaleDateString() + " finalizados com sucesso. ");
            nextRun = new Date();
            nextRun.setDate(nextRun.getDate()+1);
            console.log("Próximo processamento: "+ nextRun.toLocaleDateString());
            
          });
        }); 
      }else{
        console.log("Próximo processamento: "+ nextRun.toLocaleDateString());
      }
  }

  var j = schedule.scheduleJob('/30 * * * * *', function(){
    process();
  });
