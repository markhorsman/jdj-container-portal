const nodemailer = require('nodemailer');

import config from '../config'

const emailStockCount = (products, email, subject, intro) => {
    let body = `
    <p>Beste heer/mevrouw,</p>
    <p>${intro}</p>
    <table width="100%">
    <thead>
        <tr>
            <th style="text-align: left;">Artikelnummer</th>
            <th style="text-align: left;">Productgroep</th>
            <th style="text-align: left;">Subgroep</th>
            <th style="text-align: left;">Omschrijving</th>
            <th style="text-align: left;">Voorraad</th>
            <th style="text-align: left;">Telling</th>
        </tr>
    </thead>
    <tbody>
    `;

    products.forEach(p => body += `
    <tr>
        <td>${p.ITEMNO}</td>
        <td>${p.PGROUP}</td>
        <td>${p.GRPCODE}</td>
        <td>${p.DESC1}</td>
        <td>${p.STKLEVEL}</td>
        <td>${p.QTY}</td>
    </tr>`);

    body += '</tbody></table>';

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: config.email.auth
    });

    const mailOptions = {
        from: config.email.from, // sender address
        to: email, // list of receivers
        subject, // Subject line
        html: body, // html body
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return reject(error);
            return resolve(info);
        });
    });

};

const emailContractItems = (products, email, subject) => {
    let body = `
    <p>Beste heer/mevrouw,</p>
    <p>Onderstaand vindt u een lijst met alle artikelen die momenteel op uw naam staan:</p>
    <table width="100%">
    <thead>
        <tr>
            <th style="text-align: left;">Contractnummer</th>
            <th style="text-align: left;">Artikelnummer</th>
            <th style="text-align: left;">Omschrijving</th>
            <th style="text-align: left;">Memo</th>
            <th style="text-align: left;">Verhuurd</th>
            <th style="text-align: left;">Teruggebracht</th>
        </tr>
    </thead>
    <tbody>
    `;

    products.forEach(p => body += `
    <tr>
        <td>${p.CONTNO}</td>
        <td>${p.ITEMNO}</td>
        <td>${p.ITEMDESC}</td>
        <td>${p.MEMO}</td>
        <td>${p.QTY}</td>
        <td>${p.QTYRETD}</td>
    </tr>`);

    body += '</tbody></table>';

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: config.email.auth
    });

    const mailOptions = {
        from: config.email.from, // sender address
        to: email, // list of receivers
        subject, // Subject line
        html: body, // html body
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return reject(error);
            return resolve(info);
        });
    });

};

const emailStock = (products, email, subject) => {
    let body = `
    <p>Beste heer/mevrouw,</p>
    <p>Onderstaand vindt u een lijst met alle artikelen die momenteel op uw naam staan:</p>
    <table width="100%">
    <thead>
        <tr>
            <th style="text-align: left;">Artikelnummer</th>
            <th style="text-align: left;">Omschrijving</th>
            <th style="text-align: left;">Aantal</th>
        </tr>
    </thead>
    <tbody>
    `;

    products.forEach(p => body += `
    <tr>
        <td>${p.ITEMNO}</td>
        <td>${p.DESC1}</td>
        <td>${p.STKLEVEL}</td>
    </tr>`);

    body += '</tbody></table>';

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: config.email.auth
    });

    const mailOptions = {
        from: config.email.from, // sender address
        to: email, // list of receivers
        subject, // Subject line
        html: body, // html body
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return reject(error);
            return resolve(info);
        });
    });

};

export { emailStockCount, emailContractItems, emailStock };

