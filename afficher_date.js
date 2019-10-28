document.write("<font color='#000000' size='7' face='arial'>")
        var mydate = new Date()
        var year = mydate.getYear()
        if (year < 2000)
          year += (year < 1900) ? 1900 : 0
        var day = mydate.getDay()
        var month = mydate.getMonth()
        var daym = mydate.getDate()
        if (daym < 10)
          daym = "0" + daym
        var dayarray = new Array("Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi")
        var montharray = new Array(" Janvier ", " Février ", " Mars ", "Avril ", "Mai ", "Juin", "Juillet ", "Août ", "Septembre ", " Octobre ", " Novembre ", " Décembre ")
        document.getElementById('div_date').innerHTML = ("   " + dayarray[day] + ", " + daym + " " + montharray[month] + year + " ")
        document.write("</b></i></font>")
