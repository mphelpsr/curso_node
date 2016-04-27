function PagamentoDao(connection) {
    this._connection = connection;
}

PagamentoDao.prototype.salva = function(pagamento,callback) {
    this._connection.query('INSERT INTO pagamentos SET ?', pagamento, callback);
}

PagamentoDao.prototype.lista = function(callback) {
    this._connection.query('select * from pagamentos',callback);
}

PagamentoDao.prototype.buscaPorId = function (id,callback) {
    this._connection.query("select * from pagamentos where id = ?",[id],callback);
}

PagamentoDao.prototype.update = function (pagamento,callback) {
    this._connection.query("update pagamentos set status= ? where id = ?", [pagamento.status, pagamento.id],callback);
}

module.exports = function(){
    return PagamentoDao;
};
