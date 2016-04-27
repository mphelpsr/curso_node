module.exports	=	function(app)	{

  app.post("/cartoes/autoriza",function(req,	res)	{

  				var	cartao	=	req.body;
  				req.assert("numero",	"Número	é	obrigatório	e	deve	ter	16	caracteres.").notEmpty().len(16,16);
  				req.assert("bandeira",	"Bandeira	do	cartão	é	obrigatória.").notEmpty();
          req.assert("ano_de_expiracao", "Ano de expiracao é obrigatorio").notEmpty().len(4,4);
          req.assert("mes_de_expiracao",	"Mês	de	expiração	é	obrigatório	e	deve	ter	2	caracteres").notEmpty().len(2,2);
  				req.assert("cvv",	"CVV	é	obrigatório	e	deve	ter 3	caracteres").notEmpty().len(3,3);

          var errors = req.validationErrors();
          if(errors){
            console.log('Erros de validacao encontrados.');
            res.status(400).send(errors);
            return;

          }else{
            cartao.status = 'AUTORIZADO';
            var response = {
              dados_do_cartao: cartao
            };

            res.status(201).send(response);
          }
    });
  };
