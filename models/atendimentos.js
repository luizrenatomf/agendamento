const moment = require('moment')
const axios = require('axios')
const conexao = require('../infraestrutura/database/conexao')
const repositorio = require('../repositorios/atendimento')
const res = require('express/lib/response')

class Atendimento {
    constructor() {

        this.dataValida = ({ data, dataCriacao }) => {
            moment(data).isSameOrAfter(dataCriacao)
        }
        
        this.clientValido = (tamanho) => {
            tamanho >= 3
        }

        this.valida = (parametros) => {
            this.validacoes.filter(campo => {
                const { nome } = campo
                const parametro = parametros[nome]
                return !campo.valido(parametro)
            })
        }

        this.validacoes = [
            {
                nome: 'data',
                valido: this.dataValida,
                mensagem: 'Data deve ser maior ou igual a data atual.',
            },
            {
                nome: 'cliente',
                valido: this.clientValido,
                mensagem: 'Cliente deve ter pelo menos trÊs caracteres.',
            },
        ]

    }

    adiciona(atendimento) {
        const dataCriacao = moment().format('YYYY-MM-DD HH:mm:ss')
        const data = moment(atendimento.data, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss')
        
        const parametros = {
            data: { data, dataCriacao },
            cliente: { tamanho: atendimento.cliente.length }
        }

        const erros = this.valida(parametros) 
        const existemErros = erros.length

        if(existemErros) {
            return new Promise((resolve, reject) => {
                reject(erros)
            })
        } else {
            const atendimentoDatado = {...atendimento, dataCriacao, data}
            
            return repositorio.adiciona(atendimentoDatado)
                .then(resultados => {
                    const id = resultados.insertID
                    return ({ ...atendimento, id })
                }) 
        }
    }

    lista() {
        return repositorio.lista() 
    }

    buscaPorID(id, res) {
        const sql = `SELECT * FROM Atendimentos WHERE id=${id}`
        conexao.query(sql, async (erro, resultados) => {
            const atendimento = resultados[0]
            const cpf = atendimento.cliente
            if(erro) {
                res.status(400).json(erro)
            } else {
                const { data } = await axios.get(`http://localhost:8082/${cpf}`)
                atendimento.cliente = data
                res.status(200).json(atendimento)
            }
        })
    }

    altera(id, valores, res) {
        if(valores.data) {
            valores.data = moment(valores.data).format('YYYY-MM-DD HH:mm:ss')
        }
        const sql = 'UPDATE Atendimentos SET ? WHERE id=?'
        conexao.query(sql, [valores, id], (erro, resultados) => {
            if(erro) {
                res.status(400).json(erro)
            } else {
                res.status(200).json({...valores, id})
            }
        })
    }

    deleta(id, res) {
        const sql = 'DELETE FROM Atendimentos WHERE id=?'
        conexao.query(sql, id, (erro, resultados) => {
            if(erro) {
                res.status(400).json(erro)
            } else {
                res.status(200).json(id)
            }
        })
    }
}

module.exports = new Atendimento