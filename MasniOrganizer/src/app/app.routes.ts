import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AgendaComponent } from './home/agenda/agenda.component';
import { AddComponent } from './home/add/add.component';
import { AuthGuard } from './auth.guard';
import { FoodPlannerComponent} from './home/foodplanner/foodplanner.component';
import { ShoppingListComponent} from './home/shopping-list/shopping-list.component';
import { MyFamilyComponent} from "./my-family/my-family.component";

export const appRoutes: Routes = [
  { path: '', redirectTo: 'my-family', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'agenda', component: AgendaComponent, canActivate: [AuthGuard] },
  { path: 'add', component: AddComponent, canActivate: [AuthGuard] },
  { path: 'foodplanner', component: FoodPlannerComponent, canActivate: [AuthGuard] },
  { path: 'shopping-list', component: ShoppingListComponent },
  { path: 'my-family', component: MyFamilyComponent, canActivate: [AuthGuard] }
];
