function showFahrzeugInfo(fahrzeug) {
    const fahrzeugInfo = {
        mtw: {
            title: "Mannschaftstransportwagen (MTW)",
            image: "/picture/mtw.jpg",
            description: "Der MTW dient dem Transport von Einsatzkräften und leichter Ausrüstung."
        },
        hlf20: {
            title: "Hilfeleistungslöschgruppenfahrzeug (HLF 20/16)",
            image: "/picture/hlf20.jpg",
            description: "Das HLF 20/16 ist ein vielseitiges Einsatzfahrzeug mit Ausrüstung für Brandbekämpfung und technische Hilfeleistung."
        },
        tlf3000: {
            title: "Tanklöschfahrzeug (TLF3000 ST)",
            image: "/picture/tlf3000.jpg",
            description: "Das TLF 3000 ST hat einen großen Wassertank und ist ideal für Brandbekämpfungen in abgelegenen Gebieten."
        },
        lf8: {
            title: "Löschgruppenfahrzeug (LF8)",
            image: "/picture/lf8.jpg",
            description: "Das LF8 ist ein klassisches Löschfahrzeug für die Brandbekämpfung und kleinere technische Einsätze."
        }
    };

    const info = fahrzeugInfo[fahrzeug];
    document.getElementById('fahrzeug-title').textContent = info.title;
    document.getElementById('fahrzeug-image').src = info.image;
    document.getElementById('fahrzeug-image').style.display = 'block';
    document.getElementById('fahrzeug-description').textContent = info.description;
    document.getElementById('start-uebung-button').style.display = 'block';
}

function startUebung() {
    alert('Übung wird gestartet!');
}