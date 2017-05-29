import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { auth, database } from 'firebase';
import { UserService } from '../user/user.service';
import { Router } from '@angular/router';
import { SettingReportService } from '../setting-report/setting-report.service';
import { User } from '../../models/User';
import { AngularFire } from 'angularfire2';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import { Report } from '../../models/Report';
import { Shift } from '../../models/Shift';
import { ShiftService } from '../shift/shift.service';
import { Location } from '../../models/Location';


@Injectable()
export class FirebaseService {

  private itemToSave: FirebaseListObservable<any>;
  private userToSave: FirebaseListObservable<any>;//this user and all report saves in firebase
  private shiftsToSave: FirebaseListObservable<any>;
  private reportsToSave: FirebaseListObservable<any>;
  private database;
  private auth;
  shiftToShow: Observable<Array<Shift>>;
  shifts: Shift[];
  reports: any;

  constructor(private af: AngularFire,
    public shiftService: ShiftService,
    public userService: UserService,
    public afDb: AngularFireDatabase,
    public router: Router
  ) {

    this.shifts = [];
    this.userToSave = af.database.list('/users');
    this.shiftsToSave = this.afDb.list('/shifts');// refernce  to shifts

  };
  public getDatabase() { return this.database; };
  public getAuth() { return this.auth; };

  public login(email: string, pass: string) {

    if (email == '' || pass == '')
      return;
    this.auth.signInWithEmailAndPassword(email, pass).catch(function (error) {
      console.log(error.message);
      console.log(error.code);
    });

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
      }
      else {
        console.log('field');
      }
    });

  };

  public getReportFields() {
    this.itemToSave = this.af.database.list('/users/' + firebase.auth().currentUser.uid + '/details');
    firebase.database().ref('report-fields').once('value').then(function (snapshot) {
    });
  }

  updateUser(user, id?: string) {
    if (id) {
      this.userToSave.update(id, user).catch(error => { console.log(error.message) })
    }
    else {
      this.userToSave.update(firebase.auth().currentUser.uid, user).catch(error => {
        console.log(error.message);
      });

      console.log(user);
    }
  }


  createNewUser(email: string, password: string, user: User) {
    let newId = '';
    this.af.auth.createUser({
      email: email,
      password: password
    }).then(snapshot => {
      this.userService._user.details._sons.unshift(snapshot.uid);
      this.updateUser(this.userService._user, firebase.auth().currentUser.uid);
      this.updateUser(user, snapshot.uid);
      newId = snapshot.uid;
    }).catch(error => {
      console.log('errrrror');
    });
    // firebase.auth().createUserWithEmailAndPassword(email, password).then(snapshot=>{

    // }).catch(error=>{
    //   console.log(error.message);
    // })
  }


  initUser(goto?: string) {
    firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(snapshot => {
      console.log(snapshot.val());
      this.userService._user = snapshot.val();
      console.log(this.userService._user);
      if (goto) {
        this.router.navigate([goto]);
      }
    }).catch(error => { console.log(error.message) })

  }


  initShifts() {
    let shiftsId: string[] = [];
    this.reports = [];
    for (let id of this.userService._user.shiftsId) {//need to add sons
      shiftsId.unshift(id);
    }

    for (let id of shiftsId) {
      firebase.database().ref('/shifts/' + id).once('value').then(snapshot => {
        this.shifts.push(snapshot.val());
        for (let report of snapshot.val().reportsId)
          firebase.database().ref('/reports/' + report).once('value').then(snapshot => {
            this.reports.push(snapshot.val());
            console.log(this.reports);
          }).catch(error => {
            console.log(error.message);
          })
      }).catch(error => {
        console.log(error.message);
      })
    }


  }


  saveShift() {

    this.afDb.list('/shifts').push(this.shiftService.shift).then(resolve => {

      console.log(resolve.path.o[1]);
      this.userService.addShift(resolve.path.o[1]);
      this.shiftService.id = resolve.path.o[1];
      this.updateUser(this.userService.user);
      this.updateShift();
    }).catch(error => {

    });

  }

  updateShift() {//this will call after add report to shift 
    // console.log('in update shift ' + this.shiftService.id);
    this.shiftsToSave.update(this.shiftService.id, this.shiftService.shift).then(resolve => {
      console.log('shift update');
    }).catch(error => {
      console.log(error.message);
    });
  }

  saveReport(report: Report, id: string) {//when want to save new report, then i save the report in new id and add the id to reportsid 
    if (id == '2') {//save hot spot
      this.saveHotSpot(report);
    }
    else if (id == '1') {//save just report
      this.afDb.list('/reports').push(report).then(resolve => {
        let id = resolve.path.o[1];
        console.log(resolve.path.o[1]);
        this.shiftService.addReport(report, id);
        this.updateShift();
      }).catch(error => {
        console.log(error.message);
      });
    }
  }

  saveHotSpot(report: Report) {
    this.afDb.list('/hotSpots').push(report).then(resolve => {
      let id = resolve.path.o[1];
      console.log(resolve.path.o[1]);
      this.shiftService.addHotSpot(id);
      this.updateShift();
    }).catch(error => {
      console.log(error.message);
    });
  }

  saveColdSpot(location: Location) {
    this.afDb.list('/coldSpots').push(location).then(resolve => {
      let id = resolve.path.o[1];
      console.log(resolve.path.o[1]);
      this.shiftService.addColdSpot(id);
      this.updateShift();
    }).catch(error => {
      console.log(error.message);
    });
  }

  uploadReport(report: Report) {

  }

  public initFirebase() {
    var config = {
      apiKey: "AIzaSyAOpMbZqfS8nVvrC-BoPGP-UAmuJdFyLzE",
      authDomain: "anti-drugs-jerusalem.firebaseapp.com",
      databaseURL: "https://anti-drugs-jerusalem.firebaseio.com",
      storageBucket: "anti-drugs-jerusalem.appspot.com",
      messagingSenderId: "944977183444"
    };
    firebase.initializeApp(config);
  };

}
