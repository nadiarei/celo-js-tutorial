import QRCode from "qrcode";

import axios from "axios";
import FormData from "form-data";

import { createCanvas, loadImage } from "canvas";

// our api jwt key from pinata
const jwt_key = "";

const renderQRcode = async (ticket_id, type="blob") => {

    // size of canvas image
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    // font size and family 
    ctx.font = '20px Arial';

    // label text
    const textString = "Ticket #" + ticket_id;

    // measure width of text
    const textWidth = ctx.measureText(textString).width;

    /* set label on image
        first parameter is our text string
        second parameter is x position, in my case, position will be on center of the image
        third parameter is y position
    */
    ctx.fillText(textString, (canvas.width / 2) - (textWidth / 2), 180);

    // setting qr code image options
    const qrOption = {
        width: 180,
        padding: 0,
        margin: 0
    };

    // setting a string qr code will contain
    const qrString = window.location.origin + "/ticket_info/" + ticket_id;

    // getting a data url of generated qr code
    const bufferImage = await QRCode.toDataURL(qrString, qrOption);

    // render our qr code buffer url to image
    return loadImage(bufferImage).then((image) => {
        // draw our qr code image on canvas with text label
        // parameters are: Image, dx, dy, dw, dh 
        ctx.drawImage(image, 22, 5, 155, 155);

        // return data url of the generated image
        if(type === "data")
            return canvas.toDataURL();

        // return blob object of the generated image
        return new Promise((resolve) => {
            canvas.toBlob(resolve);
        });
    });
}

// upload image to pinata
const uploadTicketImage = async (ticket_id) => {
    // render image as blob object
    const image = await renderQRcode(ticket_id);

    try {

        const data = new FormData();
        data.append('file', image, `ticket_${ticket_id}.jpg`);

        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
            maxBodyLength: "Infinity",
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                Authorization: `Bearer ${jwt_key}`
            }
        });

        // return ipfs hash of uploaded image
        return res.data.IpfsHash;
    } catch (error) {
        console.log(error);
    }
}

// upload metadata json file to pinata
// we will set already stored image hash as a parameter hash
const uploadJson = async (ticket_id, hash) => {

    // options, we set name of the file to ticket[number]_metadata.json and image to pinata gateway url
    var data = JSON.stringify({
        "pinataOptions": {
            "cidVersion": 1
        },
        "pinataMetadata": {
            "name": `ticket${ticket_id}_metadata.json`
        },
        "pinataContent": {
            "image": `https://gateway.pinata.cloud/ipfs/${hash}`
        }
    });

    var config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt_key}`
        },
        data: data
    };

    const res = await axios(config);

    // return uploaded file ipfs hash
    return res.data.IpfsHash;
}


// we need to use anonymous async function 
(async () => {

    // id of a ticket
    const ticket_id = 1;
    
    // upload image and save ipfs hash
    const image_hash = await uploadTicketImage(ticket_id);

    // log to console ipfs hash of metadata.json file
    console.log(await uploadJson(ticket_id, image_hash))
})();
