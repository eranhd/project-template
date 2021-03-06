import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { auth, database } from "firebase";
import { UserService } from "../user/user.service";
import { Router } from "@angular/router";
import { SettingReportService } from "../setting-report/setting-report.service";
import { User } from "../../models/User";
import { AngularFireModule } from "angularfire2";
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from "angularfire2/database";
import { AngularFireAuth } from "angularfire2/auth";
import { Report } from "../../models/Report";
import { Shift } from "../../models/Shift";
import { ShiftService } from "../shift/shift.service";
import { Location } from "../../models/Location";


@Injectable()
export class FirebaseService {

  private itemToSave: FirebaseListObservable<any>;
  private userToSave: FirebaseListObservable<any>; //this user and all report saves in firebase
  private shiftsToSave: FirebaseListObservable<any>;
  private reportsToSave: FirebaseListObservable<any>;
  private database;
  private auth;

  private reObsarvable: FirebaseListObservable<any>;
  private shiftsId: string[];
  reportsId: string[];
  private coldSpotId: string[];
  private hotSpotId: string[];
  private locationsId: string[];

  private firebaseApp = [];
  shiftObsarvable: Observable<Array<Shift>>;
  reportObsarvable: Observable<Array<Report>>;
  hotObsarvable: Observable<Array<Report>>;
  coldObsarvable: Observable<Array<Location>>;
  locationObsarvable: Observable<Array<Shift>>;

  sonsObsarvable: FirebaseListObservable<any>[];

  isUserInit = false;

  shifts: Shift[];
  reports: Report[];
  hotSpots: Report[];
  coldSpots: Location[];
  locations: Location[];

  private listenSons: string[];

  constructor(private af: AngularFireModule,
    public shiftService: ShiftService,
    public userService: UserService,
    public afDb: AngularFireDatabase,
    public router: Router,
    public afAuth: AngularFireAuth
  ) {

    this.shifts = [];
    this.userToSave = afDb.list("/users");
    this.shiftsToSave = this.afDb.list("/shifts"); // refernce  to shifts
    this.initLocations();


    this.shiftObsarvable = afDb.list("shifts");
    this.shiftObsarvable.subscribe(val => {
      this.shifts = val;
    })
    this.reportObsarvable = afDb.list("reports");
    this.reportObsarvable.subscribe(val => {
      // console.log(val);

      this.reports = val;
    })
    this.hotObsarvable = afDb.list("hotSpots");
    this.hotObsarvable.subscribe(val => {
      // console.log(val);
      this.hotSpots = val;
    })
    this.coldObsarvable = afDb.list("coldSpots");
    this.coldObsarvable.subscribe(val => {
      // console.log(val);
      this.coldSpots = val;
    })

  };

  public getDatabase() { return this.database; };
  public getAuth() { return this.auth; };

  public login(email: string, pass: string) {

    if (email == "" || pass == "")
      return;
    this.auth.signInWithEmailAndPassword(email, pass).catch(function (error) {
      console.log(error.message);
      console.log(error.code);
    });

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
      }
      else {
        console.log("field");
      }
    });

  };

  public getReportFields() {
    this.itemToSave = this.afDb.list("/users/" + firebase.auth().currentUser.uid + "/details");
    firebase.database().ref("report-fields").once("value").then(function (snapshot) {
    });
  }

  updateUser(user, id?: string) {
    if (id) {
      this.userToSave.update(id, user).catch(error => { console.log(error.message) })
    }
    // else {
    //   this.userToSave.update(firebase.auth().currentUser.uid, user).catch(error => {
    //     console.log(error.message);
    //   });
    // }
    console.log(user);
  }


  private getAllDataFromDb() {

    this.reportsId = [];
    this.coldSpotId = [];
    this.hotSpotId = [];
    // this.shiftsId = [];

    this.shifts.forEach(item => {
      // console.log(item["$key"])
      if (this.checkIfShiftBelong(item["$key"])) {

        // this.shifts.push(item);

        // console.log(item)
        if (item.reportsId) {

          for (const report of item.reportsId) {
            this.reportsId.push(report);
          }
        }
        if (item.coldSpotId)
          for (const id of item.coldSpotId) {
            this.coldSpotId.push(id);
          }
        if (item.hotSpotId)
          for (const id of item.hotSpotId) {
            this.hotSpotId.push(id);
          }
      }
      // console.log(this.reportsId);


    })
    // });

    // console.log(this.shiftsId)

  }
  private updateDateArry() {


  }
  getHotSpot(id: String) {
    if (!this.hotSpots || this.hotSpots.length == 0)
      return null;

    for (let hot of this.hotSpots)
      if (hot['$key'] == id)
        return hot;

    return null;
  }

  getColdSpot(id: String) {
    if (!this.coldSpots || this.coldSpots.length == 0)
      return null;
    for (let cold of this.coldSpots)
      if (cold['$key'] == id)
        return cold;

    return null;
  }

  getReport(id: string) {
    if (!this.reports || this.reports.length == 0)
      return null;
    for (let report of this.reports)
      if (report['$key'] == id)
        return report;

    return null;
  }




  createNewUser(email: string, password: string, user: User) {
    let newId = "";

    let config = {
      apiKey: "AIzaSyDeVGTdGOQK0VvvstT4SwZlVUkYKygytQY",
      authDomain: "adjerusalem-6f3ba.firebaseapp.com",
      databaseURL: "https://adjerusalem-6f3ba.firebaseio.com",
      projectId: "adjerusalem-6f3ba",
      storageBucket: "",
      messagingSenderId: "227453393413"
    };
    this.firebaseApp.unshift(firebase.initializeApp(config, "Secondary" + this.firebaseApp.length));

    this.firebaseApp[0].auth().createUserWithEmailAndPassword(email, password).then((firebaseUser) => {
      this.userService._user.details._sons.unshift(firebaseUser.uid);
      this.updateUser(this.userService._user, firebase.auth().currentUser.uid);
      this.updateUser(user, firebaseUser.uid);
      this.firebaseApp[0].auth().signOut();
    }).catch(error => {
      console.log(error.message);
      console.log(error.code);
      console.log("error create user");
    });


    // firebase.auth().createUserWithEmailAndPassword(email, password).then(snapshot => {
    //   this.userService._user.details._sons.unshift(snapshot.uid);
    //   this.updateUser(this.userService._user, firebase.auth().currentUser.uid);
    //   this.updateUser(user, snapshot.uid);
    //   newId = snapshot.uid;
    // })
  }

  searchInSons(id) {
    for (const i of this.listenSons)
      if (i == id)
        return true;
    return false;
  }

  searchInShiftId(id) {
    if (!this.shiftsId) {
      this.shiftsId = [];
      return false;
    }
    for (const i of this.shiftsId)
      if (i == id)
        return true;
    return false;
  }

  listenToSon(id: string) {
    if (!this.listenSons)
      this.listenSons = [];
    if (!this.searchInSons(id))
      this.listenSons.push(id);
    else
      return; // stop
    //console.log(this.listenSons);
    const listen: FirebaseListObservable<any> = this.afDb.list("users/" + id);
    listen.subscribe(val => {
      //console.log(val)
      if (val[0]._sons) {
        for (const id of val[0]._sons)
          this.listenToSon(id);
      }
      if (val.length > 1)
        for (const shift of val[1]) {
          // console.log(shift);
          if (!this.searchInShiftId(shift))
            this.shiftsId.push(shift);
        }
      //console.log(this.shiftsId)
      this.getAllDataFromDb();
    },
      error => {
        console.log(error.message);
      });
  }


  initUser(goto?: string) {

    firebase.database().ref("/users/" + firebase.auth().currentUser.uid).once("value").then(snapshot => {

      this.userService._user = snapshot.val();
      // console.log(snapshot.val());
      if (this.userService._user.shiftsId) {
        for (const id of this.userService._user.shiftsId) {

          if (!this.shiftsId)
            this.shiftsId = [];
          this.shiftsId.push(id)
        }
      }


      for (const id of this.userService._user.details._sons)
        this.listenToSon(id);
      this.getAllDataFromDb();
      this.isUserInit = true;
      if (goto) {
        this.router.navigate([goto]);
      }
    }).catch(error => { console.log(error.message) })

  }
  initLocations() {
    this.afDb.list("locations").subscribe(val => {
      // console.log(val);
      this.locations = val;
    });
  }


  saveShift() {

    this.afDb.list("/shifts").push(this.shiftService.shift).then(resolve => {

      console.log(resolve.key);
      this.userService.addShift(resolve.key);
      this.shiftService.id = resolve.key;
      this.updateUser(this.userService._user, firebase.auth().currentUser.uid);
      this.updateShift();
    }).catch(error => {
      console.log("errir add shift " + error.message)
    });

  }

  updateShift() {//this will call after add report to shift
    // console.log("in update shift " + this.shiftService.id);
    this.shiftsToSave.update(this.shiftService.id, this.shiftService.shift).then(resolve => {
      console.log("shift update");
    }).catch(error => {
      console.log(error.message);
    });
  }

  saveReport(report: Report, id: string) {//when want to save new report, then i save the report in new id and add the id to reportsid
    console.log(report);
    if (id == "2") {//save hot spot
      this.saveHotSpot(report);
    }
    else if (id == "1") {//save just report
      this.afDb.list("/reports").push(report).then(resolve => {
        const id = resolve.path.o[1];
        console.log(resolve.path.o[1]);
        this.shiftService.addReport(report, id);
        this.updateShift();
      }).catch(error => {
        console.log(error.message);
      });
    }
  }

  saveHotSpot(report: Report) {
    this.afDb.list("/hotSpots").push(report).then(resolve => {
      const id = resolve.path.o[1];
      console.log(resolve.path.o[1]);
      this.shiftService.addHotSpot(id);
      this.updateShift();
    }).catch(error => {
      console.log(error.message);
    });
  }

  saveColdSpot(location: Location) {
    this.afDb.list("/coldSpots").push(location).then(resolve => {
      const id = resolve.path.o[1];
      console.log(resolve.path.o[1]);
      this.shiftService.addColdSpot(id);
      this.updateShift();
    }).catch(error => {
      console.log(error.message);
    });
  }

  uploadReport(report: Report) {

  }


  saveLoacation(loc: Location) {//this function save the location and name as insert by user in start patrol or spot
    this.afDb.list("/locations").push(loc).then(resolve => {
      console.log("location save");
    }).catch(error => {
      console.log(error.message);
    })
  }


  checkIfShiftBelong(id: any) {
    if (id) {
      if (!this.shiftsId || this.shiftsId.length == 0)
        return false;
      for (const i of this.shiftsId)
        if (i == id) {
          return true;
        }
    }
    return false;
  }

  checkIfReportBelong(id: any) {
    if (id) {
      if (!this.reportsId || this.reportsId.length == 0)
        return false;
      for (const i of this.reportsId)
        if (i == id.$key || i == id) {
          return true;
        }
    }
    return false;
  }

  checkIfHotBelong(id: any) {
    if (id) {
      if (!this.hotSpotId || this.hotSpotId.length == 0)
        return false;
      for (const i of this.hotSpotId)
        if (i == id.$key || i == id) {
          return true;
        }
    }
    return false;
  }

  checkIfColdBelong(id: any) {
    if (id) {
      if (!this.coldSpotId || this.coldSpotId.length == 0)
        return false;
      for (const i of this.coldSpotId)
        if (i == id.$key || i == id) {
          return true;
        }
    }
    return false;
  }

  getShift(id: string) {
    if (!this.shifts || this.shifts.length == 0)
      return null;
    for (let s of this.shifts)
      if (s['$key'] == id)
        return s;
    return null;
  }

  public removeData(type: string, id: string) {

    let s = null;

    if (type == "shifts") {
      s = this.afDb.list("shifts/" + id);
      s.subscribe(val => {
        console.log(val);
        for (const item of val) {
          if (item.$key == "coldSpotId")
            for (const c of item)
              this.removeData("coldSpots", c);
          if (val.$key == "hotSpotId")
            for (const h of item)
              this.removeData("hotSpots", h);

          if (val.$key == "reportsId")
            for (const r of item)
              this.removeData("reports", r);

        }
        firebase.database().ref("/" + type + "/" + id).remove().then(res => {
          console.log(res)
        }).catch(err =>
        { console.log(err.message) });
        return;
      })
    }
    else if (type == "reports" || type == "hotSpots" || type == "coldSpots") {
      firebase.database().ref("/" + type + "/" + id).remove().then(
        res => { console.log(res) }).catch(
        err => { console.log(err.message) });
      return;
    }
  }

  public initFirebase() {
    const config = {
      apiKey: "AIzaSyDeVGTdGOQK0VvvstT4SwZlVUkYKygytQY",
      authDomain: "adjerusalem-6f3ba.firebaseapp.com",
      databaseURL: "https://adjerusalem-6f3ba.firebaseio.com",
      projectId: "adjerusalem-6f3ba",
      storageBucket: "",
      messagingSenderId: "227453393413"
    };
    firebase.initializeApp(config);
  };



}
