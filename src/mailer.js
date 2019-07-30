const nodemailer = require('nodemailer');

import config from '../config'

const emailStockCount = (products, email) => {
    let body = `
    <p>Beste heer/mevrouw,</p>
    <p>Hierbij ontvangt u een tellijst van artikelen:</p>
    <table>
    <thead>
        <tr>
            <th>Artikelnummer</th>
            <th>Productgroep</th>
            <th>Subgroep</th>
            <th>Omschrijving</th>
            <th>Voorraad</th>
            <th>Telling</th>
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
        subject: 'Tellijst', // Subject line
        html: body, // html body
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return reject(error);
            return resolve(info);
        });
    });

};

export default emailStockCount;

