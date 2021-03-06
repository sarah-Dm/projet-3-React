import React from 'react';
import Entete from './Entete';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { GrStatusGoodSmall } from 'react-icons/gr';
import { FaRegEdit } from 'react-icons/fa';
import { VscLoading } from 'react-icons/vsc';
import { Link } from 'react-router-dom';
import service from '../auth-service.js';
import { AiOutlineLock } from 'react-icons/ai';

class ProfilePublic extends React.Component {
   state = {
      user: null,
      missions: [],
      missionsAconfirmer: [],
      otherMissions: [],
      validationCheck: true,
   };

   //une fois quand component mis dans la page
   componentDidMount = () => {
      this.getUser();
   };

   //à chaque fois qu'une prop ou un state change: toujours mettre un if pour cibler le props ou le state
   componentDidUpdate = (prevProps, prevState) => {
      if (prevProps.match.params.id !== this.props.match.params.id) {
         this.getUser();
      }
   };

   // aller chercher en base les missions avec le requester_id du solliciteur (front filter)
   getMissions = (userId) => {
      service
         .get(`/api/missions/user/${userId}`)
         .then((missionsFromDb) => {
            //pour enrgistrer le fait que le  user est logué
            // this.setState({ validationCheck: true });
            this.setState({ missions: missionsFromDb.data }, () => {
               //parmi ces missions portant le userId ne retourner que celles qui on un status "en attente de confirmation" === pour bénévole: celles dont il attend un retour
               let filteredMissions = this.state.missions.filter((el) => {
                  return el.status === 'En attente de confirmation';
               });
               this.setState({ missionsAconfirmer: filteredMissions });
               //parmi ces missions portant le userId retourner toutes sauf celles qui ont un statut "en attente de confirmation"=== pour bénévole: celles qui ont été confirmé ou sont passée
               let otherMissions = this.state.missions.filter((el) => {
                  return el.status !== 'En attente de confirmation';
               });
               this.setState({ otherMissions: otherMissions });
            });
         })
         .catch((err) => console.log('err in getMissions', err));
   };

   //utiliser la route pour afficher le user de l'url
   getUser = () => {
      const userId = this.props.match.params.id;
      service
         .get(`/api/users/${userId}/public`)
         .then((userFromApi) => {
            this.setState({ user: userFromApi.data }, () => {
               this.getMissions(this.state.user._id);
            });
         })
         .catch((err) => console.log('err in getUser', err));
   };

   //pour les bénévoles: compter le nbre de mission faites (missions avec ID du user dans volonteerSelected)
   countMissions = () => {
      let missions = this.state.missions.map((el) => el.volonteerSelected === this.state.user._id);
      return missions.length;
   };

   styleTextStatus = (status) => {
      let styleText;
      if (status === 'Disponible') {
         styleText = { color: 'green', textShadow: '1px 1px white' };
      } else if (status === 'En mission') {
         styleText = { color: 'red', textShadow: '1px 1px white' };
      } else {
         styleText = { color: 'orange', textShadow: '1px 1px white' };
      }
      return styleText;
   };

   styleIconStatus = (status) => {
      let color;
      if (status === 'Disponible') {
         color = 'green';
      } else if (status === 'En mission') {
         color = 'red';
      } else {
         color = 'orange';
      }
      return color;
   };

   render() {
      if (!this.props.loggedInUser) {
         return (
            <div className='enChargement'>
               Merci de vous identifier
               <AiOutlineLock size={120} />
            </div>
         );
      }

      if (!this.state.user) {
         return (
            <div className='enChargement'>
               En chargement
               <VscLoading size={120} />
            </div>
         );
      }

      if (this.state.missions.length === 0) {
         return (
            <div className='enChargement'>
               En chargement
               <VscLoading size={120} />
            </div>
         );
      }
      //cas non couvert : si c'est un nouvel inscrit qui n'a pas de mission, l'écran reste sur en chargement
      return (
         <div className='profilePublic'>
            <section>
               <Entete className='entete' user={this.state.user} />
            </section>
            <div className='profile'>
               <div className='user_details'>
                  <div className='location'>
                     <HiOutlineLocationMarker size={40} color='white' />{' '}
                     <h4>{this.state.user.location}</h4>
                  </div>
                  <ul className='status'>
                     <GrStatusGoodSmall
                        size={20}
                        color={this.styleIconStatus(this.state.user.status)}
                     />
                     <h4 style={this.styleTextStatus(this.state.user.status)}>
                        {this.state.user.status}
                     </h4>
                  </ul>

                  <ul className='list_non_modifiable'>
                     <li>
                        <p>Inscription faite le </p>
                        <h4>{this.props.formatDate(this.state.user.createdAt)}</h4>
                     </li>
                     <li>
                        <p>Type de compte</p>
                        <h4 style={{ textTransform: 'capitalize' }}>{this.state.user.userType}</h4>
                     </li>
                     {this.state.user.userType === 'solliciteur' && (
                        <li>
                           <p>Nombre d'annonces postées</p>
                           <h4>{this.state.missions.length}</h4>
                        </li>
                     )}
                     {this.state.user.userType === 'bénévole' && (
                        <li>
                           <p>Nombre de missions effectuées</p>
                           {/* filtrer les missions dont le volonteerSelected est l'id du user */}
                           <h4>{this.countMissions()}</h4>
                        </li>
                     )}
                     <li>
                        <p>Email</p> <h4>{this.state.user.email}</h4>
                     </li>
                  </ul>
                  <ul className='list_modifiable'>
                     {this.state.user.userType === 'solliciteur' && (
                        <li>
                           <p>Cause défendue</p> <h4>{this.state.user.cause}</h4>
                        </li>
                     )}
                     {this.state.user.userType === 'bénévole' && (
                        <div>
                           <li>
                              <p>Expertise</p>
                              <h4>{this.state.user.expertise}</h4>
                           </li>
                           <li>
                              <p>Date de début de disponibilité</p>
                              <h4>
                                 {this.props.formatDate(this.state.user.availability_start_date)}
                              </h4>
                           </li>
                           <li>
                              <p>Date de fin de disponibilité</p>
                              <h4>
                                 {this.props.formatDate(this.state.user.availability_end_date)}
                              </h4>
                           </li>
                           <li>
                              <p>Rythme de disponibilité</p>
                              <h4>{this.state.user.availability_frequency}</h4>
                           </li>
                        </div>
                     )}
                  </ul>
                  <div className='description'>
                     <p>Description</p> <h4>{this.state.user.description}</h4>
                  </div>
               </div>
            </div>
            <div className='missions'>
               <h2>Missions déjà effectuées ou prévues</h2>
               {this.state.otherMissions.length > 0 && (
                  <ul className='list_missions'>
                     {this.state.otherMissions.map((el) => (
                        <li key={el._id} className='each_mission'>
                           <section>
                              <div className='entete'>
                                 <div>
                                    <div className='titre'>
                                       <img src={el.requester_id.profilePic} alt='logo' />
                                       <h3>
                                          <Link to={`/users/${el.requester_id._id}/public`}>
                                             {el.requester_id.username}
                                          </Link>
                                       </h3>
                                    </div>
                                    <h3>
                                       <Link to={`/missions/${el._id}`}>{el.title}</Link>
                                    </h3>
                                    <em>
                                       {this.props.formatDate(el.start_date)}
                                       <em> au </em>
                                       {this.props.formatDate(el.end_date)}
                                    </em>
                                 </div>
                                 <Link to={`/missions/${el._id}/edit`}>
                                    <FaRegEdit size={25} />
                                 </Link>
                              </div>
                           </section>
                        </li>
                     ))}
                  </ul>
               )}
               {this.state.otherMissions.length === 0 && (
                  <h2 style={{ fontStyle: 'italic' }}>
                     Cet utilisateur n'a pas encore effectué de missions
                  </h2>
               )}
            </div>
         </div>
      );
   }
}

export default ProfilePublic;
