

module.exports = function(app){
  const	PAGAMENTO_CRIADO	=	"CRIADO";
	const	PAGAMENTO_CONFIRMADO	=	"CONFIRMADO";
	const	PAGAMENTO_CANCELADO	=	"CANCELADO";

  app.get("/pagamentos", function(req, res){

    if(req.headers.version == 'v1'){
      res.sendStatus(200);
    }else{
      res.sendStatus(422);
    }

  });

  app.get("/pagamentos/pagamento/:id", function(req, res){
    app.infra.logger.info('Recuperando ID');

    var id = req.params.id;
    var cache = app.infra.memcachedClient();

    console.log('ID: ' + id);
    //console.log('cache: ' + JSON.stringify(cache));

    cache.get('pagamento-' + id, function(err, data){
      if(err || !data){
        var connection = app.infra.connectionFactory();
        var pagamentoDao = new app.infra.PagamentoDao(connection);

        pagamentoDao.buscaPorId(id, function(exception, resultado){
          cache.set('pagamento-'	+	id,	resultado,	100000,	function	(err)	{
            console.log('nova	chave:	pagamento-'	+	id)
					});
						res.status(200).json(resultado);
				});
      }else{
	       res.status(200).json(data);
			}
    });
  });


  app.put("/pagamentos/pagamento/:id", function(req, res){
    var pagamento = req.body;
    pagamento.id = req.params.id;

    var connection = app.infra.connectionFactory();
    var pagamentoDao = new app.infra.PagamentoDao(connection);
    pagamento.data = new Date();
    pagamento.status = PAGAMENTO_CONFIRMADO;
    console.log('PAGAMENTO: ' + JSON.stringify(pagamento));

    pagamentoDao.update(pagamento, function(exception, result){
      if(exception){
        console.log('Exception: ' + exception);
        res.status(501);
      }else{
        console.log(pagamento.status);
        res.status(200).json(pagamento);
      }
    });
  });

  app.delete("/pagamentos/pagamento/:id", function(req, res){
    var pagamento = req.body;
    pagamento.id = req.params.id;

    var connection = app.infra.connectionFactory();
    var pagamentoDao = new app.infra.PagamentoDao(connection);
    pagamento.data = new Date();
    pagamento.status = PAGAMENTO_CANCELADO;
    console.log('PAGAMENTO: ' + JSON.stringify(pagamento));

    pagamentoDao.update(pagamento, function(exception, result){
      if(exception){
        console.log('Exception: ' + exception);
        res.status(501);
      }else{
        console.log(pagamento.status);
        res.status(200).json(pagamento);
      }
    });
  });

  app.post("/pagamentos/pagamento",function(req,res){
    var	body	=	req.body;
    var pagamento = body['pagamento'];

    //Inicio versionamento
    if(req.headers.version == 'application/version.v1'){
      req.assert("pagamento.forma_de_pagamento",	"Forma	de	pagamento	é	obrigatória.").notEmpty();
  		req.assert("pagamento.valor",	"Valor	é	obrigatório	e	deve	ser	um	decimal.").notEmpty().isFloat();
  		req.assert("pagamento.moeda",	"Moeda	é	obrigatória	e	deve	ter	3	caracteres").notEmpty().len(3,3);
  		var	errors	=	req.validationErrors();

      //Inicio errors
      if	(errors){
  		    console.log("Erros de validação encontrados");
  				res.status(400).send(errors);
  				return;

        //Fim errors

        //Inicio sucesso
       }else{

         var connection = app.infra.connectionFactory();
         var pagamentoDao = new app.infra.PagamentoDao(connection);
         pagamento.status = PAGAMENTO_CRIADO;
         pagamento.data = new Date();

         //Inicio forma_de_pagamento = cartao
         if(pagamento.forma_de_pagamento == 'cartao'){
           console.log('Pagamento com cartao...');
           var cartoesClient = new app.servicos.CartoesClient();

           //Inicio cartoesClient
           cartoesClient.autoriza(body['cartao'], function(err, request, response, retorno){
             if(err){
               console.log('Erro ao consultar o serviço de cartões.');
               res.status(400).send(err);
             }

             console.log('Retorno do serviço de cartoes: %j', retorno);

             pagamentoDao.salva(pagamento, function(exception, result){
               if(exception){
                 console.log('Erro ao consultar o serviço de cartões.');
                 res.status(400).send(exception);

               }else{
                 console.log('Processando pagamento com cartao...');
                 console.log(pagamento.status);
                 res.location('/pagamentos/pagamento/'	+	result.insertId);
          		    pagamento.id	=	result.insertId;
                 var response = {
                    dados_do_pagamento: pagamento,
                    cartao: retorno,
                    links:[
                      {
      										href:	"http://localhost:3000/pagamentos/pagamento/"	+	pagamento.id,
      										rel:	"confirmar",
      										method:	"PUT"
      								},
      								{
      										href:	"http://localhost:3000/pagamentos/pagamento/"	+	pagamento.id,
      										rel:	"cancelar",
      										method:	"DELETE"
      								}
                    ]
                 };
                 res.status(201).send(response);
               }
             });

           });
           //Fim cartoesClient

          //Fim forma_de_pagamento = cartao

         }else{//Inicio forma_de_pagamento != cartao
              console.log('Processando pagamento...');
              console.log(pagamento.status);

              pagamentoDao.salva(pagamento, function(exception, result){
                if(exception){
                  console.log('Erro ao consultar o serviço de cartões.');
                  res.status(400).send(exception);

                }else{
                  console.log('Processando pagamento sem cartao...');
                  console.log(pagamento.status);
                  res.location('/pagamentos/pagamento/'	+	result.insertId);
           		    pagamento.id	=	result.insertId;
                  var	response	=	{
                    dados_do_pagamento:	pagamento,
                    links: [
                      {
                              href:	"http://localhost:3000/pagamentos/pagamento/"	+	pagamento.id,
                              rel:	"confirmar",
                              method:	"PUT"
                      },
                      {
                              href:	"http://localhost:3000/pagamentos/pagamento/"	+	pagamento.id,
                              rel:	"cancelar",
                              method:	"DELETE"
                      }
                              ]
                      };
           		    res.status(201).json(response);
                }
              });

         }//Fim forma_de_pagamento != cartao

       }//Fim sucesso
    }else{
      res.sendStatus(400);
    }
    //Fim versionamento

	}); //Fim post
} //Fim modulo
