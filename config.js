export default {
    owner: ['593979939796', '573196588149', '5492916450307', '5216671548329', '573247662531', '51921826291', '50493732693'],
    botNumber: '',
    sessionName: 'Sessions/Owner',
    version: '^2.0 - Latest',
    dev: "pro",
    links: {
        api: 'https://api.yuki-wabot.my.id',
        channel: "",
        github: "",
        gmail: ""
    },
    my: {
        ch: '',
        name: 'Bot',
    },
    mess: {
        socket: ' Este comando solo puede ser ejecutado por un Socket.',
        admin: ' Este comando solo puede ser ejecutado por los Administradores del Grupo.',
        botAdmin: ' Este comando solo puede ser ejecutado si el Socket es Administrador del Grupo.'
    },
    giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
    removeBgKey: process.env.REMOVEBG_KEY  || '',

    APIs: {
        xteam:    'https://api.xteam.xyz',
        dzx:      'https://api.dhamzxploit.my.id',
        lol:      'https://api.lolhuman.xyz',
        violetics:'https://violetics.pw',
        neoxr:    'https://api.neoxr.my.id',
        zenzapis: 'https://zenzapis.xyz',
        akuari:   'https://api.akuari.my.id',
        akuari2:  'https://apimu.my.id',
        nrtm:     'https://fg-nrtm.ddns.net',
        fgmods:   'https://api-fgmods.ddns.net',

        // Primary — most reliable
        stellar: { url: "https://api.yuki-wabot.my.id", key: "YukiBot-MD" },
        vreden: { url: "https://api.vreden.web.id", key: null },
        siputzx: { url: "https://api.siputzx.my.id", key: null },
        // Secondary fallbacks — used by downloader.js
        ootaizumi: { url: "https://api.ootaizumi.web.id", key: null },
        delirius: { url: "https://api.delirius.store", key: null },
        nekolabs: { url: "https://api.nekolabs.web.id", key: null },
        axi: { url: "https://apiaxi.i11.eu", key: null },
        apifaa: { url: "https://api-faa.my.id", key: null },
        xyro: { url: "https://api.xyro.site", key: null },
        zenzxz: { url: "https://api.zenzxz.my.id", key: null },
    },

    APIKeys: {
        'https://api.xteam.xyz':       'd90a9e986e18778b',
        'https://api.lolhuman.xyz':    '85faf717d0545d14074659ad',
        'https://api.neoxr.my.id':     process.env.NEOXR_KEY   || 'yourkey',
        'https://violetics.pw':        'beta',
        'https://zenzapis.xyz':        process.env.ZENZAPIS_KEY || 'yourkey',
        'https://api-fgmods.ddns.net': 'fg-dylux'
    }
};
