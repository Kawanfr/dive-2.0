// Banco de Dados Compartilhado (Single Source of Truth)
const sharedEstablishments = [
    {
        id: 1,
        name: "Assai Atacadista (João Dias)",
        coords: [-23.646234, -46.729094],
        status: "fire",
        msg: "💥 <b>OFERTAS DE ATACADO</b><br>🍚 Arroz Camil 5kg: <b>R$ 21,90</b><br>🧼 Sabão OMO 3kg: <b>R$ 29,90</b><br>🥩 Contra Filé Peça: <b>R$ 32,90/kg</b><br>🍺 Heineken 330ml (cx 12): <b>R$ 4,49 un</b>",
        color: "red",
        icon: "https://www.google.com/s2/favicons?domain=assai.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 08:00 - 18:00",
        schedule: { week: [7, 22], sun: [8, 18] }
    },
    {
        id: 2,
        name: "Carrefour Hipermercado (João Dias)",
        coords: [-23.642270, -46.734588],
        status: "fire",
        msg: "📢 <b>SÓ HOJE!</b><br>🥛 Leite Ninho Integral: <b>R$ 3,89</b><br>🍫 Barra de Chocolate Nestlé: <b>R$ 3,99</b><br>🧴 Shampoo Pantene: <b>Leve 3 Pague 2</b><br>🍗 Frango a Passarinho 1kg: <b>R$ 12,99</b>",
        color: "red",
        icon: "https://www.google.com/s2/favicons?domain=carrefour.com.br&sz=128",
        hours: "🕒 Aberto todos os dias: 06:00 - 23:00",
        schedule: { all: [6, 23] }
    },
    {
        id: 3,
        name: "Akki Atacadista João Dias",
        coords: [-23.642038, -46.738812],
        status: "fire",
        msg: "🔥 <b>QUEIMA DE ESTOQUE</b><br>🫒 Azeite Galo 500ml: <b>R$ 29,90</b><br>🥪 Margarina Qualy 500g: <b>R$ 5,99</b><br>🥤 Coca-Cola 2.5L: <b>R$ 7,99</b><br>🍕 Pizza Sadia: <b>R$ 14,90</b>",
        color: "red",
        icon: "https://www.google.com/s2/favicons?domain=akkiatacadista.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 07:00 - 20:00",
        schedule: { week: [7, 22], sun: [7, 20] }
    },
    {
        id: 4,
        name: "Ayumi Supermercado",
        coords: [-23.649516, -46.733178],
        status: "fire",
        msg: "📉 <b>BAIXOU O PREÇO</b><br>☕ Café Pilão 500g: <b>R$ 13,99</b><br>🥖 Pão Francês (kg): <b>R$ 12,90</b><br>🧼 Detergente Ypê: <b>R$ 1,99</b><br>🥚 Ovo Branco (Cartela 30): <b>R$ 16,90</b>",
        color: "red",
        icon: "https://www.google.com/s2/favicons?domain=ayumisupermercados.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 08:00 - 21:00 | Dom: 08:00 - 14:00",
        schedule: { week: [8, 21], sun: [8, 14] }
    },
    {
        id: 5,
        name: "Atacadão",
        coords: [-23.668816, -46.736381],
        status: "fire",
        msg: "📦 <b>LEVE MAIS, PAGUE MENOS</b><br>🧹 Kit Limpeza Veja: <b>R$ 15,90</b><br>🧻 Papel Higiênico Neve (24un): <b>R$ 26,90</b><br>🍪 Biscoito Treloso (cx): <b>R$ 8,99</b><br>🧼 Amaciante Downy 1.5L: <b>R$ 18,90</b>",
        color: "red",
        icon: "https://www.google.com/s2/favicons?domain=atacadao.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 08:00 - 18:00",
        schedule: { week: [7, 22], sun: [8, 18] }
    }
];