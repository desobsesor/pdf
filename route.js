const {join} = require('path');
const moment = require('moment');
const pdfs = require('html-pdf');
const {promisify} = require('util');
const handlebars = require('handlebars');
const read = promisify(require('fs').readFile);

module.exports = function (app) {
    //#region PROPIEDADES PDF
    const opciones = {format: 'A4', quality: 300};
    //#endregion
    //#region METODOS
    function formatearNumero(numero) {
        numero = parseFloat(numero).toFixed(1);
        var n = numero.toString().split(".");
        n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return n.join(".");
    }
    //#endregion
    //#region METODOS PARA LA GENERACIÓN DEL DOCUMENTO PDF
   function generarJSON(req, res) {
        const data = {
            empresa: {
                nombre: req.body.empresa
            },
            cliente: {},
            productos: [],
            factura: req.body.factura,
            fecha_creacion: moment().format('DD/MM/YYYY'),
            fecha_vencimiento: moment().add(14, 'days').format('DD/MM/YYYY')
        };
        res.status(200).send({ msg:data });
    }
    //#region METODOS PARA LA GENERACIÓN DEL DOCUMENTO PDF
    async function generarPDFFactura(req, res) {
        const data = {
            empresa: {
                nombre: req.body.empresa.empresa,
                direccion: 'Calle '+req.body.empresa.direccion.calle+' # '+req.body.empresa.direccion.numero+' Manzana '+
                    req.body.empresa.direccion.manzana+', '+req.body.empresa.direccion.barrio,
                ciudad: req.body.empresa.direccion.municipio+ ', '+req.body.empresa.direccion.departamento,
                nit: req.body.empresa.nit
            },
            cliente: {},
            productos:[],
            factura_no: req.body.factura_no,
            fecha_creacion: moment().format('DD/MM/YYYY'),
            fecha_vencimiento: moment().add(14, 'days').format('DD/MM/YYYY')
        };

        data.tituloFactura = req.body.titulo;

        data.cliente = {
            documento: req.body.cliente.documento,
            nombre: req.body.cliente.nombre,
            email: req.body.cliente.email,
        };

        const productos = req.body.productos;

        for(let i = 0; i<productos.length; i++){
            data.productos.push({
                    producto: productos[i].itemMedicamento.nombreGenerico,
                    cantidad: productos[i].cantidad,
                    precio: formatearNumero(productos[i].precioUnitario),
                    subtotal: formatearNumero(productos[i].subtotal),
                    total: formatearNumero(productos[i].total),
                });
        }

        const total = data.productos.map(producto => producto.precio).reduce((a, b) => a + b, 0);
        data.subtotal = formatearNumero(req.body.factura.subtotal);
        data.total =  formatearNumero(req.body.factura.total);
        data.productos.forEach(producto => producto.precio = producto.precio);
        //const source = await read(join(`${__dirname}/sources/templates/factura.html`), 'utf-8');
        const source = await read(join(`${__dirname}/sources/templates/factura.html`), 'utf-8');
        const template = handlebars.compile(source);
        const html = template(data);
        const pdf = pdfs.create(html, opciones);
        pdf.toFile = promisify(pdf.toFile);
        await pdf.toFile(`${join(__dirname, '/sources/temp/pdf/invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf')}`);
        res.status(200).send({
                path:'http://pdf.cds.net.co/sources/temp/pdf/',
                //path:'http://localhost:5025/sources/temp/pdf/',
                file:'invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf',
                msg: 'sources/temp/pdf/invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf'});
    }
    async function generarPDFCajaControl(req, res) {
        const data = {
            empresa: {
                nombre: req.body.empresa.empresa,
                direccion: 'Calle '+req.body.empresa.direccion.calle+' # '+req.body.empresa.direccion.numero+' Manzana '+
                    req.body.empresa.direccion.manzana+', '+req.body.empresa.direccion.barrio,
                ciudad: req.body.empresa.direccion.municipio+ ', '+req.body.empresa.direccion.departamento,
                nit: req.body.empresa.nit
            },
            cliente: {},
            productos:[],
            factura_no: req.body.factura_no,
            fecha_creacion: moment().format('DD/MM/YYYY'),
            fecha_vencimiento: moment().add(14, 'days').format('DD/MM/YYYY')
        };

        data.tituloFactura = req.body.titulo;

        data.cliente = {
            documento: req.body.cliente.documento,
            nombre: req.body.cliente.nombre,
            email: req.body.cliente.email,
        };

        const productos = req.body.productos;
        console.log('productos:', productos);

        for(let i = 0; i<productos.length; i++){
            data.productos.push({
                producto: productos[i].itemMedicamento.nombreGenerico,
                cantidad: productos[i].cantidad,
                precio: formatearNumero(productos[i].precioUnitario),
                subtotal: formatearNumero(productos[i].subtotal),
                total: formatearNumero(productos[i].total),
            });
        }

        // const total = data.productos.map(producto => producto.precio).reduce((a, b) => a + b, 0);
        data.subtotal = formatearNumero(req.body.factura.subtotal);
        data.total =  formatearNumero(req.body.factura.total);
        data.productos.forEach(producto => producto.precio = producto.precio);
        const source = await read(join(`${__dirname}/sources/templates/factura.html`), 'utf-8');
        const template = handlebars.compile(source);
        const html = template(data);
        const pdf = pdf.create(html, opciones);
        pdf.toFile = promisify(pdf.toFile);
        await pdf.toFile(`${join(__dirname, '/sources/temp/pdf/invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf')}`);
        res.status(200).send({
            path:'http://pdf.cds.net.co/sources/temp/pdf/',
            // path:'http://localhost:5022/sources/temp/pdf/',
            file:'invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf',
            msg: 'sources/temp/pdf/invoice_'+req.body.empresa.nit+'_'+req.body.cliente.documento+'_'+req.body.factura_no+'.pdf'});
    }
    //#endregion
    //#region ENDPOINTS PARA SERVIR DOCUMENTOS
    app.post('/api/gfacturass', function (req, res) {
        generarJSON(req, res)
    });
    app.get('/api/gfacturas', function (req, res) {
        res.send({msg: req.body})
    });
    app.post('/api/gfactura', function (req, res) {
        generarPDFFactura(req, res);
    });
    app.get('/api/inicio', function (req, res) {
        res.send({msg: 'Servidor iniciado ...'})
    });
    app.post('/api/gcajacontrol', function (req, res) {
        generarPDFCajaControl(req, res);
    });
    //#endregion
};
