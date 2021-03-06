import { Component, OnInit } from "@angular/core";
import { ReportService } from "../../service/report/report.service";
import { UserService } from "../../service/user/user.service"
import { Report } from "../../models/Report";
import { Shift } from "../../models/Shift";
import { FirebaseService } from "../../service/firebase/firebase.service";
import { LocationName } from "../../pipe/locationName.pipe";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"]
})
export class HeaderComponent implements OnInit {


  newsData: string[];
  curr: string;
  index: number;
  shiftIndex: number;


  constructor(public userService: UserService,
              public reportService: ReportService,
              public firebaseService: FirebaseService,
              private locPipe: LocationName) {

    this.index = 0;
    this.shiftIndex = 0;
    const event = [];
    this.firebaseService.shiftObsarvable.subscribe(val => {
      for (const s of val)
        if (this.firebaseService.checkIfShiftBelong(s["$key"]))
          event.push(s);
    })
    this.firebaseService.reportObsarvable.subscribe(val => {
      for (const s of val)
        if (this.firebaseService.checkIfReportBelong(s["$key"]))
          event.push(s);
    })
    this.firebaseService.hotObsarvable.subscribe(val => {
      for (const s of val)
        if (this.firebaseService.checkIfHotBelong(s["$key"]))
          event.push(s);
    })

    const curr = "";


    setInterval(() => {

      if (event.length != 0){

        this.index %= event.length;

        if (event[this.index] != null){
          if (event[this.index].stratShift)
          {
            const d = new Date(event[this.index].stratShift.date);
            this.curr = "בתאריך " + d.toLocaleDateString() + "התחילה משמרת " + " בשעה " + d.toLocaleTimeString();
            this.curr += " ב" + this.locPipe.transform(event[this.index].stratShift.location);
            if(event[this.index].endShift){
              const ed = new Date(event[this.index].endShift.date);
              this.curr +=  " והסתיימה בשעה " + ed.toLocaleTimeString() + " ב" + this.locPipe.transform(event[this.index].endShift.location);
            }
            else
              this.curr += " אך לא הסתיימה";
          }
          else if (event[this.index].fields)
          {
            let a = event[this.index].date;
            const d = new Date(a);
            this.curr = "בתאריך " + d.toLocaleDateString() + " מולא דוח של התנהגות חריגה";
          }
          else if (event[this.index].lat)
          {
            this.curr = "נקודה קרה נדקרה ב" + this.locPipe.transform(event[this.index]);
          }
        }
        this.index++;
      }
    }, 3000)
  }

  ngOnInit() {
  }

}
